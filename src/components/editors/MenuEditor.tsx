"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent, Button, Input, FormGroup } from "@/components/ui";
import toast from "react-hot-toast";

interface MenuItem {
  id: string;
  label: string;
  url: string;
  icon?: string;
  displayOrder: number;
  isActive: boolean;
}

interface Menu {
  id: string;
  name: string;
  type: "main" | "footer" | "sidebar" | "header";
  items: MenuItem[];
  isActive: boolean;
}

interface MenuEditorProps {
  menus: Menu[];
  onSave: (menus: Menu[]) => Promise<void>;
  readOnly?: boolean;
}

export default function MenuEditor({ menus: initialMenus, onSave, readOnly = false }: MenuEditorProps) {
  const [menus, setMenus] = useState<Menu[]>(initialMenus);
  const [selectedMenuId, setSelectedMenuId] = useState<string>(menus[0]?.id || "");
  const [newItemLabel, setNewItemLabel] = useState("");
  const [newItemUrl, setNewItemUrl] = useState("");
  const [newItemIcon, setNewItemIcon] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedMenu = menus.find((m) => m.id === selectedMenuId);

  const handleAddItem = (menuId: string) => {
    if (!newItemLabel.trim() || !newItemUrl.trim()) {
      toast.error("Label and URL are required");
      return;
    }

    setMenus((prev) =>
      prev.map((menu) => {
        if (menu.id === menuId) {
          return {
            ...menu,
            items: [
              ...menu.items,
              {
                id: `item-${Date.now()}`,
                label: newItemLabel,
                url: newItemUrl,
                icon: newItemIcon,
                displayOrder: menu.items.length,
                isActive: true,
              },
            ],
          };
        }
        return menu;
      })
    );

    setNewItemLabel("");
    setNewItemUrl("");
    setNewItemIcon("");
    toast.success("Item added");
  };

  const handleRemoveItem = (menuId: string, itemId: string) => {
    setMenus((prev) =>
      prev.map((menu) => {
        if (menu.id === menuId) {
          return {
            ...menu,
            items: menu.items.filter((item) => item.id !== itemId),
          };
        }
        return menu;
      })
    );
    toast.success("Item removed");
  };

  const handleUpdateItem = (menuId: string, itemId: string, updates: Partial<MenuItem>) => {
    setMenus((prev) =>
      prev.map((menu) => {
        if (menu.id === menuId) {
          return {
            ...menu,
            items: menu.items.map((item) =>
              item.id === itemId ? { ...item, ...updates } : item
            ),
          };
        }
        return menu;
      })
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await onSave(menus);
      toast.success("Menu saved successfully");
    } catch (error) {
      toast.error("Failed to save menu");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Menu Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Menu</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {menus.map((menu) => (
              <motion.button
                key={menu.id}
                whileHover={{ scale: 1.02 }}
                onClick={() => setSelectedMenuId(menu.id)}
                className={`p-4 rounded border-2 transition ${
                  selectedMenuId === menu.id
                    ? "border-amber-500 bg-amber-500/10"
                    : "border-slate-600 hover:border-amber-400"
                }`}
              >
                <div className="text-sm font-semibold">{menu.name}</div>
                <div className="text-xs text-gray-400 mt-1 capitalize">{menu.type}</div>
                <div className="text-xs text-amber-400 mt-2">{menu.items.length} items</div>
              </motion.button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Menu Items Editor */}
      {selectedMenu && (
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedMenu.name} Menu Items ({selectedMenu.items.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Add New Item */}
            {!readOnly && (
              <div className="p-4 bg-slate-700/50 rounded border border-amber-500/20">
                <h4 className="font-semibold mb-4">Add New Menu Item</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <FormGroup label="Label">
                    <Input
                      value={newItemLabel}
                      onChange={(e) => setNewItemLabel(e.target.value)}
                      placeholder="e.g., Home"
                    />
                  </FormGroup>
                  <FormGroup label="URL">
                    <Input
                      value={newItemUrl}
                      onChange={(e) => setNewItemUrl(e.target.value)}
                      placeholder="e.g., /home"
                    />
                  </FormGroup>
                  <FormGroup label="Icon (Optional)">
                    <Input
                      value={newItemIcon}
                      onChange={(e) => setNewItemIcon(e.target.value)}
                      placeholder="e.g., fa-home"
                    />
                  </FormGroup>
                  <div className="flex items-end">
                    <Button
                      onClick={() => handleAddItem(selectedMenu.id)}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      Add Item
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Items List */}
            <div className="space-y-3">
              {selectedMenu.items.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No menu items yet. Add one above.</p>
              ) : (
                selectedMenu.items.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 bg-slate-700/30 rounded border border-slate-600 hover:border-amber-400/50 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="text-xs text-gray-400 block mb-1">Label</label>
                            <Input
                              value={item.label}
                              onChange={(e) =>
                                handleUpdateItem(selectedMenu.id, item.id, { label: e.target.value })
                              }
                              disabled={readOnly}
                              placeholder="Menu label"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-400 block mb-1">URL</label>
                            <Input
                              value={item.url}
                              onChange={(e) =>
                                handleUpdateItem(selectedMenu.id, item.id, { url: e.target.value })
                              }
                              disabled={readOnly}
                              placeholder="Menu URL"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-400 block mb-1">Icon</label>
                            <Input
                              value={item.icon || ""}
                              onChange={(e) =>
                                handleUpdateItem(selectedMenu.id, item.id, { icon: e.target.value })
                              }
                              disabled={readOnly}
                              placeholder="Icon class"
                            />
                          </div>
                        </div>
                      </div>
                      {!readOnly && (
                        <button
                          onClick={() => handleRemoveItem(selectedMenu.id, item.id)}
                          className="text-red-400 hover:text-red-300 ml-4 flex-shrink-0"
                          title="Remove item"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Save Button */}
            {!readOnly && (
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
              >
                <i className="fas fa-save mr-2"></i>
                {saving ? "Saving..." : "Save Menu"}
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
