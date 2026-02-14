import React, { useState, useEffect } from "react";
import { Plus, Trash2, Check, Pencil, GripVertical} from "lucide-react";
import { db, auth } from "./firebase";
import { motion, AnimatePresence } from "framer-motion";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  doc,
  deleteDoc,
  updateDoc,
  where
} from "firebase/firestore";

import {
  onAuthStateChanged,
  signOut
} from "firebase/auth";
import Login from "./Login";

import {
  DndContext,
  closestCenter
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableTask({ task, handleToggleTask, handleDeleteTask, handleEditTask }) {

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({
    id: task.id,
    transition: {
      duration: 200,
      easing: "cubic-bezier(0.25, 1, 0.5, 1)"
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="flex items-center justify-between bg-white rounded-2xl px-5 py-4 shadow-sm hover:shadow-xl transition"
    >

      {/* LEFT SIDE */}
      <div
        className="flex items-center gap-4 cursor-pointer"
        onClick={() =>
          handleToggleTask(task.id, task.completed)
        }
      >
        <div
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400"
        >
          <GripVertical size={18} />
        </div>

        {task.completed ? (
          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
            <Check size={14} className="text-white" />
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full border-2 border-gray-300" />
        )}

        <div className="flex flex-col">
          <span
            className={`text-sm ${
              task.completed
                ? "line-through text-gray-400"
                : "text-gray-900 font-medium"
            }`}
          >
            {task.text}
          </span>

          {task.dueDate && (
            <span className="text-xs text-gray-400">
              Due: {task.dueDate}
            </span>
          )}
        </div>

      </div>

      {/* RIGHT SIDE */}
      <div className="flex gap-3">

        <button onClick={() => handleEditTask(task)}>
          ✏️
        </button>

        <button onClick={() => handleDeleteTask(task.id)}>
          <Trash2 size={18} className="text-red-500" />
        </button>

      </div>
    </div>
  );
}

export default function App() {

  //  AUTH STATES
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  //  TASK STATES
  const [tasks, setTasks] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTaskText, setNewTaskText] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [editingTask, setEditingTask] = useState(null);
  const [editText, setEditText] = useState("");
  const [editDueDate, setEditDueDate] = useState("");

  //  AUTH LISTENER
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ✅ USER-SPECIFIC TASKS (VERY IMPORTANT)
  useEffect(() => {

    if (!user) return;

    const q = query(
      collection(db, "todos"),
      where("uid", "==", user.uid) //  only this user's tasks
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data()
      }));
      data.sort((a, b) => a.order - b.order);

      data.sort((a, b) => a.order - b.order);
      setTasks(data);

    });

    return () => unsub();

  }, [user]);

  //  ADD TASK
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    await addDoc(collection(db, "todos"), {
      text: newTaskText,
      completed: false,
      uid: user.uid,
      dueDate: dueDate || null,
      order: Date.now() // ⭐ important
    });

    setDueDate("");
    setNewTaskText("");
    setIsDialogOpen(false);
  };

  //  TOGGLE TASK
  const handleToggleTask = async (id, completed) => {
    await updateDoc(doc(db, "todos", id), {
      completed: !completed
    });
  };

  //  DELETE TASK
  const handleDeleteTask = async (id) => {
    await deleteDoc(doc(db, "todos", id));
  };

  // EDIT TASK
  const handleEditTask = (task) => {
    setEditingTask(task);
    setEditText(task.text);
    setEditDueDate(task.dueDate || "");
  };

  // UPDATE TASK
  const handleUpdateTask = async (e) => {
    e.preventDefault();

    await updateDoc(doc(db, "todos", editingTask.id), {
      text: editText,
      dueDate: editDueDate || null
    });

    setEditingTask(null);
  };
  const handleDragEnd = async (event) => {

    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = tasks.findIndex(t => t.id === active.id);
    const newIndex = tasks.findIndex(t => t.id === over.id);

    const newTasks = arrayMove(tasks, oldIndex, newIndex);
    setTasks(newTasks);

    // Update Firestore order
    await Promise.all(
      newTasks.map((task, index) =>
        updateDoc(doc(db, "todos", task.id), {
          order: index
        })
      )
    );
  };

  //  PROGRESS
  const completed = tasks.filter((t) => t.completed).length;
  const total = tasks.length;
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

  //  SHOW LOGIN IF NOT AUTHENTICATED
  if (loading) return null;

  if (!user) {
    return <Login />;
  }

  //  MAIN UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex justify-center">
      {/* Logout */}
      <button
        onClick={() => signOut(auth)}
        className="absolute top-6 right-6 bg-white px-4 py-2 rounded-xl shadow hover:shadow-md transition"
      >
        Logout
      </button>

      <div className="w-full max-w-md px-6 pt-12 pb-32">

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-semibold tracking-tight text-gray-900">
            To-Dos
          </h1>

          <p className="text-gray-400 mt-1">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric"
            })}
          </p>
        </div>

        {/* Progress Ring */}
        <div className="flex flex-col items-center mb-14">
          <div className="relative w-36 h-36">
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="72"
                cy="72"
                r="62"
                stroke="#E5E7EB"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="72"
                cy="72"
                r="62"
                stroke="#2563EB"
                style={{ filter: "drop-shadow(0px 0px 6px rgba(37,99,235,0.6))" }}
                strokeWidth="8"
                fill="none"
                strokeDasharray={390}
                strokeDashoffset={390 - (390 * progress) / 100}
                strokeLinecap="round"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-semibold text-gray-900">
                {completed}
              </span>
              <span className="text-sm text-gray-400">
                of {total} tasks
              </span>
            </div>
          </div>

          <p className="mt-5 text-gray-500">
            Keep going 🔥
          </p>
        </div>

        {/* Tasks */}
        <h2 className="text-xs tracking-widest text-gray-400 font-semibold mb-4">
          TASKS
        </h2>

        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >

          <SortableContext
            items={tasks.map(task => task.id)}
            strategy={verticalListSortingStrategy}
          >

            <div className="space-y-4">
              {tasks.map(task => (
                <SortableTask
                  key={task.id}
                  task={task}
                  handleToggleTask={handleToggleTask}
                  handleDeleteTask={handleDeleteTask}
                  handleEditTask={handleEditTask}
                />
              ))}
            </div>

          </SortableContext>
        </DndContext>

      </div>

      {/* Floating Add Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsDialogOpen(true)}
          className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-blue-600 
                    text-white flex items-center justify-center shadow-2xl"
        >
          <Plus size={28} />
  </motion.button>

      {/* Add Task Modal */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-80 shadow-xl animate-[fadeIn_.25s_ease]">
            <h3 className="text-lg font-semibold mb-4">
              New Task
            </h3>

            <form onSubmit={handleAddTask}>
              <input
                autoFocus
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                className="w-full border border-gray-200 rounded-lg p-3 mb-4 outline-none"
                placeholder="What needs to be done?"
              />
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full border border-gray-200 rounded-lg p-3 mb-4 outline-none"
              />

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setIsDialogOpen(false)}
                  className="text-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {editingTask && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-80 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">
              Edit Task
            </h3>

            <form onSubmit={handleUpdateTask}>

              <input
                autoFocus
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full border border-gray-200 rounded-lg p-3 mb-4 outline-none"
              />

              <input
                type="date"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
                className="w-full border border-gray-200 rounded-lg p-3 mb-4 outline-none"
              />

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="text-gray-400"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg"
                >
                  Update
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
