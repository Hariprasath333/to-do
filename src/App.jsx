import React, { useState, useEffect } from "react";
import { Plus, Trash2, Check, Pencil, GripVertical, Moon, Sun } from "lucide-react";
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
  where,
  getDoc,
  setDoc,
  writeBatch
} from "firebase/firestore";

import {
  onAuthStateChanged,
  signOut
} from "firebase/auth";
import Login from "./Login";

import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor
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
      duration: 150,
      easing: "ease"
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: "transform 180ms ease"
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-2xl md:rounded-3xl px-5 py-4 md:px-7 md:py-4 shadow-sm hover:shadow-xl dark:shadow-none dark:border dark:border-slate-700 transition-all duration-300"
    >

      {/* LEFT SIDE */}
      <div
        className="flex items-center gap-4 md:gap-5 cursor-pointer"
        onClick={() =>
          handleToggleTask(task.id, task.completed)
        }
      >
        <div
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors touch-none"
        >
          <div className="md:hidden"><GripVertical size={18} /></div>
          <div className="hidden md:block"><GripVertical size={20} /></div>
        </div>

        {task.completed ? (
          <div className="w-6 h-6 md:w-7 md:h-7 min-w-[24px] min-h-[24px] md:min-w-[28px] md:min-h-[28px] rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
            <div className="md:hidden"><Check size={14} className="text-white" /></div>
            <div className="hidden md:block"><Check size={16} className="text-white" /></div>
          </div>
        ) : (
          <div className="w-6 h-6 md:w-7 md:h-7 min-w-[24px] min-h-[24px] md:min-w-[28px] md:min-h-[28px] rounded-full border-2 border-gray-300 dark:border-slate-600 flex-shrink-0 transition-colors" />
        )}

        <div className="flex flex-col gap-0 md:gap-1">
          <span
            className={`text-sm md:text-base ${task.completed
                ? "line-through text-gray-400 dark:text-slate-500"
                : "text-gray-900 dark:text-slate-100 font-medium"
              }`}
          >
            {task.text}
          </span>

          {task.dueDate && (
            <span className="text-xs md:text-sm text-gray-400 dark:text-slate-500">
              Due: {task.dueDate}
            </span>
          )}
        </div>

      </div>

      {/* RIGHT SIDE */}
      <div className="flex gap-3 md:gap-4">

        <button onClick={() => handleEditTask(task)} className="text-base md:text-lg hover:scale-110 transition-transform dark:opacity-80 dark:hover:opacity-100">
          ✏️
        </button>

        <button onClick={() => handleDeleteTask(task.id)} className="hover:scale-110 transition-transform">
          <div className="md:hidden"><Trash2 size={18} className="text-red-500 hover:text-red-600" /></div>
          <div className="hidden md:block"><Trash2 size={20} className="text-red-500 hover:text-red-600" /></div>
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
  const [isPremium, setIsPremium] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    })
  );
  //  AUTH LISTENER
  useEffect(() => {

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {

      setUser(currentUser);
      setLoading(false);

      if (currentUser) {

        const saveUser = async () => {
          await setDoc(
            doc(db, "users", currentUser.uid),
            {
              email: currentUser.email
            },
            { merge: true }
          );
        };

        saveUser(); 
      }
    });

    return () => unsubscribe();

  }, []);

  useEffect(() => {
    const callBackend = async () => {
      if (!user) return;

      try {
        const res = await fetchWithAuth("http://localhost:5000/todos");
        const data = await res.text();

        console.log("Backend says:", data);

      } catch (err) {
        console.error("Backend error:", err);
      }
    };

    callBackend();
  }, [user]);

  // ✅ USER-SPECIFIC TASKS 
  useEffect(() => {

    if (!user) return;

    const q = query(
      collection(db, "todos"),
      where("uid", "==", user.uid)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data()
      }));
      data.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      setTasks(data);

    });

    return () => unsub();

  }, [user]);

  const handlePremium = async () => {
    try {
      // 1. Create order from backend
      const res = await fetch("http://localhost:5000/create-order", {
        method: "POST"
      });

      const order = await res.json();

      // 2. Load Razorpay script if not loaded
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);

      script.onload = () => {
        const options = {
          key: "rzp_test_SevbLa90X2qDs7", 
          amount: order.amount,
          currency: order.currency,
          name: "To-Do App",
          description: "Upgrade to Premium",
          order_id: order.id,

          handler: async function (response) {
            // 3. Verify payment
            const verifyRes = await fetch("http://localhost:5000/verify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify(response)
            });

            const data = await verifyRes.json();

            if (data.success) {
              alert("Payment successful!");

              // 4. Unlock premium
              setIsPremium(true);

              await updateDoc(doc(db, "users", user.uid), {
                premium: true
              });

            } else {
              alert("Payment verification failed");
            }
          },

          theme: {
            color: "#2563EB"
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      };

    } catch (err) {
      console.error("Payment error:", err);
    }
  };
  //  ADD TASK
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    let insertIndex = tasks.length;
    
    if (dueDate) {
      const index = tasks.findIndex(t => {
        if (!t.dueDate) return true;
        return t.dueDate > dueDate;
      });
      if (index !== -1) {
        insertIndex = index;
      }
    }

    const newTaskRef = doc(collection(db, "todos"));
    const newTask = {
      text: newTaskText,
      completed: false,
      uid: user.uid,
      dueDate: dueDate || null,
      order: insertIndex
    };

    const batch = writeBatch(db);
    batch.set(newTaskRef, newTask);

    for (let i = insertIndex; i < tasks.length; i++) {
      const taskRef = doc(db, "todos", tasks[i].id);
      batch.update(taskRef, { order: i + 1 });
    }

    await batch.commit();

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
    const batch = writeBatch(db);
    newTasks.forEach((task, index) => {
      const taskRef = doc(db, "todos", task.id);
      batch.update(taskRef, { order: index });
    });

    await batch.commit();
  };
  //  AUTH FETCH HELPER (JWT)
  const fetchWithAuth = async (url, options = {}) => {
    const token = await auth.currentUser.getIdToken();

    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`
      }
    });
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 transition-colors duration-300">

      {/* HEADER */}
      <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 bg-white dark:bg-slate-900 shadow-sm dark:shadow-slate-900/50 sticky top-0 z-50 transition-colors duration-300">

        {/* LEFT: Profile Icon */}
        <div className="flex-1 flex justify-start">
          <button
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold text-sm sm:text-base cursor-default"
          >
            {user?.email?.charAt(0).toUpperCase()}
          </button>
        </div>

        {/* CENTER: Title */}
        <div className="flex-1 flex justify-center">
          <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
            To-Dos
          </h1>
        </div>

        {/* RIGHT: Logout */}
        <div className="flex-1 flex items-center justify-end gap-2 sm:gap-3">

          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="hidden sm:block p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {!isPremium && (
            <button
              onClick={handlePremium}
              className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl shadow-md hover:scale-105 transition text-xs sm:text-base font-medium whitespace-nowrap"
            >
              <span className="hidden sm:inline">Upgrade </span>🚀
            </button>
          )}

          {isPremium && (
            <span className="bg-yellow-400 text-white px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm whitespace-nowrap">
              ⭐ <span className="hidden sm:inline">Premium</span>
            </span>
          )}

          <button
            onClick={() => signOut(auth)}
            className="bg-gray-100 dark:bg-slate-800 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 text-xs sm:text-base dark:text-white whitespace-nowrap transition-colors"
          >
            Logout
          </button>
        </div>

      </div>

      {/* Mobile Dark Mode Toggle (Below Header, Top Right) */}
      <div className="sm:hidden flex justify-end px-6 pt-4">
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="p-2 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-gray-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      <div className="w-full max-w-5xl mx-auto px-6 pt-4 sm:pt-8 md:pt-12 pb-32 grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
        {/* Progress Ring */}
        <div className="w-full flex flex-col items-center md:pr-16 lg:pr-24 md:sticky top-[35vh] self-start">
          <div className="relative w-36 h-36 md:w-56 md:h-56 z-10">
            {/* Soft ambient background glow */}
            <div className="absolute inset-4 md:inset-8 rounded-full bg-blue-400/20 blur-xl md:blur-3xl -z-10"></div>

            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="progress-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#60A5FA" />
                  <stop offset="100%" stopColor="#2563EB" />
                </linearGradient>
              </defs>
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                className="text-slate-200 dark:text-slate-700 transition-colors duration-300"
                strokeWidth="7"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="url(#progress-grad)"
                strokeWidth="7"
                fill="none"
                strokeDasharray={251.2}
                strokeDashoffset={251.2 - (251.2 * progress) / 100}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl md:text-6xl font-bold text-slate-800 dark:text-white tracking-tight transition-colors duration-300">
                {completed}
              </span>
              <span className="text-xs md:text-sm font-medium text-slate-400 dark:text-slate-500 mt-1 md:mt-2 transition-colors duration-300">
                of {total} tasks
              </span>
            </div>
          </div>

          <p className="mt-4 md:mt-6 text-gray-500 dark:text-slate-400 md:text-lg transition-colors duration-300">
            Keep going 🔥
          </p>
        </div>

        {/* Tasks */}
        <div className="space-y-4 max-w-md w-full">
          <h2 className="text-xs tracking-widest text-gray-400 font-semibold">
            TASKS :
          </h2>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            autoScroll={{
              threshold: {
                y: 0.2
              }
            }}
          >

            <SortableContext
              items={tasks.map(task => task.id)}
              strategy={verticalListSortingStrategy}
            >

              {tasks.map(task => (
                <SortableTask
                  key={task.id}
                  task={task}
                  handleToggleTask={handleToggleTask}
                  handleDeleteTask={handleDeleteTask}
                  handleEditTask={handleEditTask}
                />
              ))}

            </SortableContext>
          </DndContext>

        </div>
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
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-80 shadow-xl animate-[fadeIn_.25s_ease] transition-colors duration-300">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              New Task
            </h3>

            <form onSubmit={handleAddTask}>
              <input
                autoFocus
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                className="w-full border border-gray-200 dark:border-slate-600 bg-transparent dark:text-white rounded-lg p-3 mb-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="What needs to be done?"
              />
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full border border-gray-200 dark:border-slate-600 bg-transparent dark:text-white dark:[color-scheme:dark] rounded-lg p-3 mb-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setIsDialogOpen(false)}
                  className="text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
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
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-80 shadow-xl transition-colors duration-300">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Edit Task
            </h3>

            <form onSubmit={handleUpdateTask}>

              <input
                autoFocus
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full border border-gray-200 dark:border-slate-600 bg-transparent dark:text-white rounded-lg p-3 mb-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />

              <input
                type="date"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
                className="w-full border border-gray-200 dark:border-slate-600 bg-transparent dark:text-white dark:[color-scheme:dark] rounded-lg p-3 mb-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
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
