import { useState, useCallback, useEffect } from "react";
import { Wand2, Clock, Settings, Sparkles, LayoutTemplate, ChevronDown, Trash2, Pencil, X, ShieldCheck } from "lucide-react";
import logo from "@/assets/logo.png";
import logoIcon from "@/assets/logo-icon.png";
import { useNavigate } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { PROMPT_TEMPLATES, TEMPLATE_CATEGORIES, getCustomTemplates, deleteCustomTemplate, PromptTemplate } from "@/lib/templates";
import { useTemplateSelect } from "@/lib/template-context";
import { CreateTemplateDialog } from "@/components/CreateTemplateDialog";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const navItems = [
  { title: "Enhance", url: "/app", icon: Wand2 },
  { title: "History", url: "/history", icon: Clock },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
  const onTemplateSelect = useTemplateSelect();
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [customTemplates, setCustomTemplates] = useState<PromptTemplate[]>(() => getCustomTemplates());
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle()
        .then(({ data }) => setIsAdmin(!!data));
    });
  }, []);

  const refreshCustom = useCallback(() => {
    setCustomTemplates(getCustomTemplates());
  }, []);

  const handleTemplate = (prompt: string, model: string) => {
    navigate("/app");
    onTemplateSelect?.(prompt, model);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteCustomTemplate(id);
    refreshCustom();
    toast({ title: "Template deleted" });
  };

  const allTemplates = [...PROMPT_TEMPLATES, ...customTemplates];

  const filtered = activeCategory === "all"
    ? allTemplates
    : activeCategory === "custom"
      ? customTemplates
      : allTemplates.filter((t) => t.category === activeCategory);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {collapsed ? (
              <img src={logoIcon} alt="Prompt Engineer" className="h-8 w-8 object-contain" />
            ) : (
              <img src={logo} alt="Prompt Engineer" className="h-8 w-auto" />
            )}
          </div>
          {isMobile && (
            <button
              onClick={() => setOpenMobile(false)}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        {/* Main nav */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.slice(0, 1).map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium">
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Templates with collapsible arrow */}
        {!collapsed && (
          <SidebarGroup>
            <Collapsible open={templatesOpen} onOpenChange={setTemplatesOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                <span className="flex items-center gap-1.5">
                  <LayoutTemplate className="h-3.5 w-3.5" />
                  Templates
                  {customTemplates.length > 0 && (
                    <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                      +{customTemplates.length}
                    </span>
                  )}
                </span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${templatesOpen ? "rotate-180" : ""}`} />
              </CollapsibleTrigger>
              <CollapsibleContent>
                {/* Create / Edit template dialog */}
                <CreateTemplateDialog
                  onSaved={refreshCustom}
                  editTemplate={editingTemplate}
                  onEditDone={() => setEditingTemplate(null)}
                />

                {/* Category filters */}
                <div className="flex flex-wrap gap-1 px-3 py-2">
                  {TEMPLATE_CATEGORIES.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setActiveCategory(c.id)}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors ${
                        activeCategory === c.id
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
                      }`}
                    >
                      <span>{c.icon}</span>
                      {c.label}
                    </button>
                  ))}
                </div>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {filtered.map((t) => (
                      <SidebarMenuItem key={t.id}>
                        <SidebarMenuButton
                          onClick={() => handleTemplate(t.prompt, t.model)}
                          className="hover:bg-sidebar-accent/50 cursor-pointer group/item"
                        >
                          <span className="mr-2 text-sm">{t.icon}</span>
                          <span className="text-xs truncate flex-1">{t.label}</span>
                          {t.isCustom && (
                            <div className="flex items-center gap-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => { e.stopPropagation(); setEditingTemplate(t); }}
                                className="p-0.5 hover:text-primary"
                              >
                                <Pencil className="h-3 w-3" />
                              </button>
                              <button
                                onClick={(e) => handleDelete(t.id, e)}
                                className="p-0.5 hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                    {filtered.length === 0 && (
                      <p className="px-3 py-2 text-[10px] text-muted-foreground">No templates in this category</p>
                    )}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </Collapsible>
          </SidebarGroup>
        )}

        {/* History & Settings */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.slice(1).map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end={false} className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium">
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/admin" end={false} className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium">
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      {!collapsed && <span>Admin</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

