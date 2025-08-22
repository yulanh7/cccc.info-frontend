import React from "react";

type Props = {
  rows?: number;
  cols?: number;
  zebra?: boolean;
};

export default function TableSkeleton({ rows = 5, cols = 7, zebra = true }: Props) {
  return (
    <tbody>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className={zebra && i % 2 ? "bg-gray-50" : ""}>
          {Array.from({ length: cols }).map((__, j) => (
            <td key={j} className="py-3 px-4">
              <div className="h-4 w-32 rounded bg-gray-200 animate-pulse" />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}
