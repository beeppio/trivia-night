import { DndContext, KeyboardSensor, MouseSensor, TouchSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

function Item({ id, text, disabled }: { id: number; text: string; disabled: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: String(id), disabled });
  return <button ref={setNodeRef} type="button" disabled={disabled} style={{ transform: CSS.Transform.toString(transform), transition }} {...attributes} {...listeners} className={`flex min-h-12 w-full touch-pan-y items-center gap-3 rounded-2xl border border-primary/50 bg-primary/15 px-4 py-3 text-left text-white disabled:opacity-60 ${isDragging ? 'relative z-10 bg-primary shadow-xl' : 'cursor-grab active:cursor-grabbing'}`}><span className="min-w-0 flex-1 break-words font-semibold">{text}</span><GripVertical aria-hidden="true" className="h-5 w-5 shrink-0" /></button>;
}

export function OrderingAnswer({ items, order, onChange, disabled }: { items: string[]; order: number[]; onChange: (order: number[]) => void; disabled: boolean }) {
  const sensors = useSensors(useSensor(MouseSensor, { activationConstraint: { distance: 8 } }), useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  return <div className="space-y-3"><p className="text-sm text-muted-foreground">Hold and drag to arrange. With a keyboard, use Space and arrow keys.</p><DndContext sensors={sensors} collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis]} onDragEnd={({ active, over }) => { if (!disabled && over && active.id !== over.id) onChange(arrayMove(order, order.indexOf(Number(active.id)), order.indexOf(Number(over.id)))); }}><SortableContext items={order.map(String)} strategy={verticalListSortingStrategy}><ol className="space-y-3">{order.map((id, index) => <li key={id} className="flex items-center gap-3"><span className="w-7 shrink-0 text-lg font-semibold tabular-nums text-white">{index + 1}.</span><Item id={id} text={items[id]} disabled={disabled} /></li>)}</ol></SortableContext></DndContext></div>;
}
