"use client";

import { useEffect } from "react";

function normalizedIdPart(value) {
  return String(value || "champ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "champ";
}

function associateStandaloneLabels(root = document) {
  const labels = root.querySelectorAll("label:not([for])");
  let sequence = 0;

  labels.forEach((label) => {
    if (label.querySelector("input, select, textarea")) return;

    const control = label.nextElementSibling;
    if (!control?.matches("input, select, textarea")) return;

    if (!control.id) {
      let candidate = `champ-${normalizedIdPart(label.textContent)}-${sequence += 1}`;
      while (document.getElementById(candidate)) {
        candidate = `champ-${normalizedIdPart(label.textContent)}-${sequence += 1}`;
      }
      control.id = candidate;
    }

    label.htmlFor = control.id;
  });
}

export default function AccessibleFormLabels() {
  useEffect(() => {
    associateStandaloneLabels();

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) associateStandaloneLabels(node);
        });
      }
      associateStandaloneLabels();
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
