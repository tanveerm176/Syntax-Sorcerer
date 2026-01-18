/**
 * CodebaseStatus Component
 *
 * Displays a visual indicator showing whether an active codebase is loaded.
 * Includes a status badge and updates reactively when codebase is added/removed.
 *
 * Features:
 * - Real-time status indicator (green dot = active, gray dot = inactive)
 * - Displays session seed information
 * - Automatically refreshes when codebase is loaded/deleted
 *
 * @component
 * @returns {JSX.Element} Status indicator with badge
 */
"use client";
import { useCallback, useEffect, useState } from "react";
import styles from "../app/styles/Chatbot.module.css";

export default function CodebaseStatus() {
  const [isActive, setIsActive] = useState(false);
  const [seed, setSeed] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to check codebase status
  const checkStatus = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_URL}/status`);
      const data = await response.json();
      setIsActive(data.active);
      setSeed(data.seed);
      setLoading(false);
    } catch (error) {
      console.error("Error checking codebase status:", error);
      setLoading(false);
    }
  }, []);

  // Check status on component mount
  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Listen for custom events to refresh status when codebase is added/removed
  useEffect(() => {
    const handleCodebaseChange = () => {
      checkStatus();
    };

    window.addEventListener("codebaseDownloaded", handleCodebaseChange);
    window.addEventListener("codebaseDeleted", handleCodebaseChange);

    return () => {
      window.removeEventListener("codebaseDownloaded", handleCodebaseChange);
      window.removeEventListener("codebaseDeleted", handleCodebaseChange);
    };
  }, [checkStatus]);

  if (loading) {
    return (
      <div className={styles.statusIndicator}>
        <div className={styles.statusBadge + " " + styles.loading}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className={styles.statusIndicator}>
      <div
        className={
          styles.statusBadge +
          " " +
          (isActive ? styles.active : styles.inactive)
        }
      >
        <span className={styles.statusDot}></span>
        <span className={styles.statusText}>
          {isActive ? "Codebase Active" : "No Codebase"}
        </span>
      </div>
    </div>
  );
}
