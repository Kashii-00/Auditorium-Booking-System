import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { authRequest } from "../../services/authService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function BatchAddLecturers({ onLecturersAdded }) {
  const { id: batchId } = useParams();
  const [lecturers, setLecturers] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [batch, setBatch] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchBatch = async () => {
      try {
        const batchData = await authRequest("get", `http://localhost:5003/api/batches/${batchId}`);
        if (isMounted) setBatch(batchData);
      } catch {
        if (isMounted) setBatch(null);
      }
    };
    try {
      fetchBatch();
    } catch {}
    return () => { isMounted = false; };
  }, [batchId]);

  useEffect(() => {
    let isMounted = true;
    const fetchLecturers = async () => {
      setLoading(true);
      setError("");
      try {
        const allLecturers = await authRequest("get", "http://localhost:5003/api/lecturer-registration");
        const assigned = await authRequest("get", `http://localhost:5003/api/batches/${batchId}/lecturers`);
        const assignedIds = assigned.map(l => l.id);
        const filtered = allLecturers.filter(l => {
          let courseIds = [];
          if (Array.isArray(l.course_ids)) {
            courseIds = l.course_ids.map(Number);
          } else if (typeof l.course_ids === "string") {
            courseIds = l.course_ids.split(",").map(Number);
          }
          return (
            batch &&
            courseIds.includes(Number(batch.course_id)) &&
            !assignedIds.includes(l.id)
          );
        });
        if (isMounted) setLecturers(filtered);
      } catch (err) {
        if (isMounted) setError("Failed to load available lecturers. Please try again later.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    try {
      if (batch && batch.course_id) {
        fetchLecturers();
      }
    } catch {}
    return () => { isMounted = false; };
  }, [batchId, batch]);

  const handleSelect = (id) => {
    setSelected(sel =>
      sel.includes(id) ? sel.filter(i => i !== id) : [...sel, id]
    );
  };

  const handleAdd = async () => {
    if (!selected.length) {
      setError("Please select at least one lecturer.");
      return;
    }
    try {
      await authRequest("post", `http://localhost:5003/api/batches/${batchId}/lecturers`, {
        lecturer_ids: selected,
      });
      if (onLecturersAdded) onLecturersAdded();
      setSelected([]);
      setError("");
    } catch {
      setError("Failed to add lecturers to batch. Please try again.");
    }
  };

  let filteredLecturers = [];
  try {
    filteredLecturers = lecturers.filter(l =>
      l.full_name.toLowerCase().includes(search.toLowerCase()) ||
      l.email.toLowerCase().includes(search.toLowerCase())
    );
  } catch (err) {
    filteredLecturers = [];
  }

  return (
    <div>
      {batch && (
        <div className="mb-2 text-sm text-gray-700">
          <strong>Lecturers Assigned:</strong> {batch.lecturer_count || 0} / {batch.capacity || 0}
        </div>
      )}
      <Input
        placeholder="Search lecturers by name or email"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="mb-4"
      />
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {loading ? (
        <div>Loading...</div>
      ) : filteredLecturers.length === 0 ? (
        <div>No available lecturers found for this batch.</div>
      ) : (
        <table className="w-full">
          <thead>
            <tr>
              <th></th>
              <th>Name</th>
              <th>Email</th>
              <th>Courses</th>
            </tr>
          </thead>
          <tbody>
            {filteredLecturers.map(l => (
              <tr key={l.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selected.includes(l.id)}
                    onChange={() => handleSelect(l.id)}
                  />
                </td>
                <td>{l.full_name}</td>
                <td>{l.email}</td>
                <td>{l.courses}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <Button
        className="mt-4"
        disabled={
          selected.length === 0 ||
          (batch && batch.lecturer_count + selected.length > batch.capacity)
        }
        onClick={handleAdd}
      >
        Add Selected Lecturers ({selected.length})
      </Button>
    </div>
  );
}
