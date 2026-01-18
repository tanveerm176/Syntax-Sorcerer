/**
 * CodebaseControls Component
 *
 * Provides UI controls for managing code repositories:
 * - Download and process a codebase from a GitHub ZIP URL
 * - Delete the currently loaded codebase
 *
 * Uses SweetAlert2 for user feedback (success/error notifications)
 * Integration with backend API endpoints for download and deletion
 *
 * @component
 * @returns {JSX.Element} Control panel with download/delete functionality
 */
"use client";
import { useRef } from "react";
import Swal from "sweetalert2";
import styles from "../app/styles/Chatbot.module.css";

export default function CodebaseControls() {
  // Reference to the URL input field for codebase download
  const codebaseURLInput = useRef(null);

  /**
   * Downloads and processes a codebase from a provided GitHub ZIP URL
   * Sends the URL to the /download API endpoint which:
   * 1. Downloads the ZIP file from the provided URL
   * 2. Extracts it to the user's codebase directory
   * 3. Processes all JavaScript files to extract functions and classes
   * 4. Generates embeddings for each extracted code element
   * 5. Stores embeddings in the Pinecone vector database
   *
   * Shows SweetAlert notifications for success or error feedback
   *
   * @async
   */
  async function downloadCodebase() {
    const response = await fetch(`${process.env.NEXT_PUBLIC_URL}/download`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url: codebaseURLInput.current.value }),
    });

    const result = await response.json();
    if (result.error) {
      Swal.fire({
        title: "Error",
        text: result.error,
        icon: "error",
        heightAuto: false,
        confirmButtonColor: "#8d77d4",
      });
    } else {
      Swal.fire({
        title: "Success",
        text: result.message,
        icon: "success",
        heightAuto: false,
        confirmButtonColor: "#8d77d4",
      });
    }
  }

  /**
   * Deletes the currently loaded codebase and clears all associated data
   * Sends request to /delete API endpoint which:
   * 1. Removes the codebase directory from the filesystem
   * 2. Clears all vectors from the Pinecone index namespace
   * 3. Flushes Redis chat history for this session
   *
   * Shows SweetAlert notifications for success or error feedback
   *
   * @async
   */
  async function deleteCodebase() {
    const response = await fetch(`${process.env.NEXT_PUBLIC_URL}/delete`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();
    if (result.error) {
      Swal.fire({
        title: "Error",
        text: result.error,
        icon: "error",
        heightAuto: false,
        confirmButtonColor: "#8d77d4",
      });
    } else {
      Swal.fire({
        title: "Success",
        text: result.message,
        icon: "success",
        heightAuto: false,
        confirmButtonColor: "#8d77d4",
      });
    }
  }

  return (
    <div className={styles.flex}>
      {/* Input field for GitHub repository ZIP URL */}
      <input
        type="text"
        id="codebase-url"
        className={styles.input}
        placeholder="Enter codebase URL (must be a link to download a .zip file)"
        ref={codebaseURLInput}
      />
      {/* Button to download, extract, and process the codebase */}
      <button
        id="download-button"
        className={styles.codebaseButton}
        onClick={downloadCodebase}
      >
        Download
      </button>
      {/* Button to delete the currently loaded codebase and clear embeddings */}
      <button
        id="delete-button"
        className={styles.codebaseButton}
        onClick={deleteCodebase}
      >
        Remove
      </button>
    </div>
  );
}
