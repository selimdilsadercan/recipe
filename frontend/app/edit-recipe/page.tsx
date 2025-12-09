"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Trash,
  Plus,
  DotsSixVertical,
} from "@phosphor-icons/react";
import { useUser } from "@clerk/clerk-react";
import {
  getRecipeByIdAction,
  updateRecipeAction,
  getOrCreateUserAction,
} from "./actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { lib } from "@/lib/client";

// Local types for editing (with id for drag-drop)
interface EditableIngredient {
  id: string;
  name: string;
  amount?: string;
}

interface EditableInstruction {
  id: string;
  step: number;
  text: string;
}

// Sortable Item Components
function SortableIngredientItem({
  item,
  onUpdate,
  onDelete,
}: {
  item: EditableIngredient;
  onUpdate: (id: string, updates: Partial<EditableIngredient>) => void;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-2 mb-1"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-gray-400 hover:text-gray-600"
      >
        <DotsSixVertical size={20} />
      </button>
      <input
        type="text"
        value={item.amount || ""}
        onChange={(e) => onUpdate(item.id, { amount: e.target.value })}
        placeholder="Miktar"
        className="w-20 px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:border-[#FF6B35]"
      />
      <input
        type="text"
        value={item.name}
        onChange={(e) => onUpdate(item.id, { name: e.target.value })}
        placeholder="Malzeme adı"
        className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:border-[#FF6B35]"
      />
      <button
        onClick={() => onDelete(item.id)}
        className="p-1 text-red-500 hover:bg-red-50 rounded"
      >
        <Trash size={18} />
      </button>
    </div>
  );
}

function SortableInstructionItem({
  item,
  index,
  onUpdate,
  onDelete,
}: {
  item: EditableInstruction;
  index: number;
  onUpdate: (id: string, updates: Partial<EditableInstruction>) => void;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-3 mb-2"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-gray-400 hover:text-gray-600"
      >
        <DotsSixVertical size={20} />
      </button>
      <div className="w-7 h-7 rounded-full bg-[#FF6B35] text-white flex items-center justify-center font-semibold text-sm flex-shrink-0">
        {index + 1}
      </div>
      <textarea
        value={item.text}
        onChange={(e) => onUpdate(item.id, { text: e.target.value })}
        placeholder="Adım açıklaması"
        rows={2}
        className="flex-1 min-w-0 px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:border-[#FF6B35] resize-none"
      />
      <button
        onClick={() => onDelete(item.id)}
        className="p-1 text-red-500 hover:bg-red-50 rounded flex-shrink-0"
      >
        <Trash size={18} />
      </button>
    </div>
  );
}

function EditRecipeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const recipeId = searchParams.get("id");
  const { user } = useUser();

  const [originalRecipe, setOriginalRecipe] = useState<lib.Recipe | null>(null);
  const [title, setTitle] = useState("");
  const [ingredients, setIngredients] = useState<EditableIngredient[]>([]);
  const [instructions, setInstructions] = useState<EditableInstruction[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Generate unique ID
  const generateId = () =>
    `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Convert lib types to editable types
  const toEditableIngredients = (
    items: lib.Ingredient[] | null
  ): EditableIngredient[] => {
    if (!items) return [];
    return items.map((item) => ({
      id: generateId(),
      name: item.name,
      amount: item.amount,
    }));
  };

  const toEditableInstructions = (
    items: lib.Instruction[] | null
  ): EditableInstruction[] => {
    if (!items) return [];
    return items.map((item) => ({
      id: generateId(),
      step: item.step,
      text: item.text,
    }));
  };

  // Convert back to lib types
  const toLibIngredients = (items: EditableIngredient[]): lib.Ingredient[] => {
    return items.map((item) => ({
      name: item.name,
      amount: item.amount,
    }));
  };

  const toLibInstructions = (
    items: EditableInstruction[]
  ): lib.Instruction[] => {
    return items.map((item, idx) => ({
      step: idx + 1,
      text: item.text,
    }));
  };

  // Check for changes
  const checkChanges = useCallback(() => {
    if (!originalRecipe) return false;
    if (title !== originalRecipe.title) return true;
    // Simple check - could be more sophisticated
    return true; // For now, assume there are changes after any edit
  }, [originalRecipe, title]);

  useEffect(() => {
    if (recipeId) {
      fetchRecipe();
    } else {
      setError("Tarif ID'si bulunamadı");
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipeId]);

  async function fetchRecipe() {
    if (!recipeId) return;

    try {
      setLoading(true);
      const result = await getRecipeByIdAction(recipeId);
      if (result.data) {
        setOriginalRecipe(result.data);
        setTitle(result.data.title);
        setIngredients(toEditableIngredients(result.data.ingredients));
        setInstructions(toEditableInstructions(result.data.instructions));
      } else {
        setError(result.error || "Tarif bulunamadı");
      }
    } catch (err) {
      console.error(err);
      setError("Tarif yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  }

  // Handle back button
  function handleBack() {
    if (hasChanges) {
      setShowExitDialog(true);
    } else {
      router.back();
    }
  }

  // Handle save
  async function handleSave() {
    if (!recipeId || !user?.id) return;

    try {
      setSaving(true);
      setError(null);

      // Get Supabase user ID
      const userResult = await getOrCreateUserAction(user.id);
      if (!userResult.data) {
        setError(userResult.error || "Kullanıcı bilgisi alınamadı");
        return;
      }

      const result = await updateRecipeAction(
        recipeId,
        userResult.data.id,
        title,
        toLibIngredients(ingredients),
        toLibInstructions(instructions)
      );

      if (result.data) {
        setHasChanges(false);
        router.push(`/recipe?id=${recipeId}`);
      } else {
        setError(result.error || "Tarif güncellenemedi");
      }
    } catch (err) {
      console.error(err);
      setError("Tarif kaydedilirken hata oluştu");
    } finally {
      setSaving(false);
    }
  }

  // Ingredient handlers
  function handleIngredientUpdate(
    id: string,
    updates: Partial<EditableIngredient>
  ) {
    setIngredients((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
    setHasChanges(true);
  }

  function handleIngredientDelete(id: string) {
    setIngredients((prev) => prev.filter((item) => item.id !== id));
    setHasChanges(true);
  }

  function handleIngredientAdd() {
    setIngredients((prev) => [
      ...prev,
      { id: generateId(), name: "", amount: "" },
    ]);
    setHasChanges(true);
  }

  function handleIngredientDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setIngredients((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
      setHasChanges(true);
    }
  }

  // Instruction handlers
  function handleInstructionUpdate(
    id: string,
    updates: Partial<EditableInstruction>
  ) {
    setInstructions((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
    setHasChanges(true);
  }

  function handleInstructionDelete(id: string) {
    setInstructions((prev) => prev.filter((item) => item.id !== id));
    setHasChanges(true);
  }

  function handleInstructionAdd() {
    setInstructions((prev) => [
      ...prev,
      { id: generateId(), step: prev.length + 1, text: "" },
    ]);
    setHasChanges(true);
  }

  function handleInstructionDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setInstructions((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
      setHasChanges(true);
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF9F7]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B35]"></div>
      </div>
    );
  }

  // Error state
  if (error && !originalRecipe) {
    return (
      <div className="flex min-h-screen flex-col bg-[#FAF9F7]">
        <header className="flex items-center px-5 py-4">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft size={24} color="#374151" />
          </button>
        </header>
        <main className="flex-1 flex items-center justify-center px-5">
          <p className="text-red-500">{error}</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF9F7]">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 bg-white border-b border-gray-100 sticky top-0 z-10">
        <button
          onClick={handleBack}
          className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft size={24} color="#374151" />
        </button>
        <h1 className="font-semibold text-gray-900">Tarifi Düzenle</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="p-2 -mr-2 hover:bg-green-50 rounded-full transition-colors text-green-600 disabled:opacity-50"
        >
          {saving ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
          ) : (
            <Check size={24} weight="bold" />
          )}
        </button>
      </header>

      {/* Exit Confirmation Dialog */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kaydedilmemiş değişiklikler</AlertDialogTitle>
            <AlertDialogDescription>
              Yaptığınız değişiklikler kaydedilmedi. Çıkmak istediğinize emin
              misiniz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => router.back()}
              className="bg-red-600 hover:bg-red-700"
            >
              Çık
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Error Banner */}
      {error && (
        <div className="mx-5 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Content */}
      <main className="flex-1 px-5 py-4 overflow-y-auto pb-20">
        {/* Title Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tarif Adı
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setHasChanges(true);
            }}
            placeholder="Tarif adını girin"
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-[#FF6B35] text-lg"
          />
        </div>

        {/* Ingredients Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700">
              Malzemeler
            </label>
            <button
              onClick={handleIngredientAdd}
              className="flex items-center gap-1 text-[#FF6B35] text-sm font-medium hover:text-[#e55a2b]"
            >
              <Plus size={18} />
              Ekle
            </button>
          </div>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleIngredientDragEnd}
          >
            <SortableContext
              items={ingredients.map((i) => i.id)}
              strategy={verticalListSortingStrategy}
            >
              {ingredients.map((ingredient) => (
                <SortableIngredientItem
                  key={ingredient.id}
                  item={ingredient}
                  onUpdate={handleIngredientUpdate}
                  onDelete={handleIngredientDelete}
                />
              ))}
            </SortableContext>
          </DndContext>
          {ingredients.length === 0 && (
            <p className="text-gray-400 text-sm text-center py-4">
              Henüz malzeme eklenmedi
            </p>
          )}
        </div>

        {/* Instructions Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700">Yapılış</label>
            <button
              onClick={handleInstructionAdd}
              className="flex items-center gap-1 text-[#FF6B35] text-sm font-medium hover:text-[#e55a2b]"
            >
              <Plus size={18} />
              Ekle
            </button>
          </div>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleInstructionDragEnd}
          >
            <SortableContext
              items={instructions.map((i) => i.id)}
              strategy={verticalListSortingStrategy}
            >
              {instructions.map((instruction, index) => (
                <SortableInstructionItem
                  key={instruction.id}
                  item={instruction}
                  index={index}
                  onUpdate={handleInstructionUpdate}
                  onDelete={handleInstructionDelete}
                />
              ))}
            </SortableContext>
          </DndContext>
          {instructions.length === 0 && (
            <p className="text-gray-400 text-sm text-center py-4">
              Henüz yapılış adımı eklenmedi
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

export default function EditRecipePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#FAF9F7]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B35]"></div>
        </div>
      }
    >
      <EditRecipeContent />
    </Suspense>
  );
}
