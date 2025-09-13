// File: CourseRevenueSummaryPanel.jsx
import React, { useEffect, useState, useCallback } from "react";
import { authRequest } from "../../services/authService";
import { getApiUrl } from "../../utils/apiUrl";
import "./styles/styles.css";

const CourseRevenueSummaryPanel = ({
  data,
  successMessage,
  setSuccessMessage,
  error,
  setError,
}) => {
  const BASE_PATH = "/course-revenue-summary";

  const [courseBatchId, setCourseBatchId] = useState("");
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(false);

  const clearMsgs = () => {
    setSuccessMessage?.("");
    setError?.("");
  };

  const canUseIds =
    data?.payments_main_details_id && courseBatchId.trim() !== "";

  const fetchRecord = useCallback(async () => {
    if (!canUseIds) return;
    setLoading(true);
    clearMsgs();
    try {
      const res = await authRequest(
        "get",
        getApiUrl(
          `${BASE_PATH}/${data.payments_main_details_id}/${Number(
            courseBatchId
          )}`
        )
      );
      setRecord(res || null);
    } catch (err) {
      if (err?.response?.status === 404) {
        setRecord(null); // allow create
      } else {
        setRecord(null);
        setError?.(
          err?.response?.data?.error || "Failed to load revenue summary."
        );
      }
    } finally {
      setLoading(false);
    }
  }, [data?.payments_main_details_id, courseBatchId, setError]);

  const createRecord = async () => {
    if (!canUseIds) {
      setError?.("Missing payments_main_details_id or courseBatch_id.");
      return;
    }
    clearMsgs();
    setLoading(true);
    try {
      await authRequest("post", getApiUrl(`${BASE_PATH}`), {
        payments_main_details_id: Number(data.payments_main_details_id),
        courseBatch_id: Number(courseBatchId),
      });
      setSuccessMessage?.("Revenue summary created successfully.");
      await fetchRecord();
    } catch (err) {
      setError?.(err?.response?.data?.error || "Failed to create record.");
    } finally {
      setLoading(false);
    }
  };

  const deleteRecord = async () => {
    if (!canUseIds) {
      setError?.("Missing payments_main_details_id or courseBatch_id.");
      return;
    }
    clearMsgs();
    setLoading(true);
    try {
      await authRequest(
        "delete",
        getApiUrl(
          `${BASE_PATH}/${data.payments_main_details_id}/${Number(
            courseBatchId
          )}`
        )
      );
      setRecord(null);
      setSuccessMessage?.("Revenue summary deleted successfully.");
    } catch (err) {
      setError?.(err?.response?.data?.error || "Failed to delete record.");
    } finally {
      setLoading(false);
    }
  };

  // refresh automatically when courseBatchId or payments_main_details_id changes
  useEffect(() => {
    fetchRecord();
  }, [fetchRecord]);

  const createDisabled = loading || !!record || !canUseIds;
  const deleteDisabled = loading || !record;

  return (
    <div className="mainCostCon">
      <div className="aid-request-form-type2">
        <h2 className="page-description-type2 h2-type2">
          Course Revenue Summary
        </h2>

        {successMessage && (
          <div className="success-popup2">{successMessage}</div>
        )}
        {error && <div className="error-popup2">{error}</div>}

        {/* Batch ID input */}
        <div className="form-step" style={{ marginBottom: 12 }}>
          <label style={{ fontWeight: 600 }}>Course Batch ID:</label>
          <input
            type="number"
            value={courseBatchId}
            onChange={(e) => setCourseBatchId(e.target.value)}
            placeholder="Enter batch ID"
            className="ccfinput"
            style={{ width: "200px", marginLeft: "10px" }}
          />
        </div>

        <div className="form-buttons-sticky btnHalf">
          <div className="navigation-buttons">
            <button
              type="button"
              onClick={createRecord}
              disabled={createDisabled}
              className="ccfbtn"
              title={
                record
                  ? "Record exists — delete it to re-create."
                  : !canUseIds
                  ? "Missing IDs."
                  : undefined
              }
            >
              {loading && !record ? "Working..." : "Create Record"}
            </button>

            <button
              type="button"
              onClick={deleteRecord}
              disabled={deleteDisabled}
              className="ccfbtn"
              style={{ marginLeft: 10 }}
            >
              {loading && record ? "Working..." : "Delete Record"}
            </button>

            <button
              type="button"
              onClick={fetchRecord}
              disabled={loading || !canUseIds}
              className="ccfbtn"
              style={{ marginLeft: 10 }}
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>
      </div>

      {/* Record view */}
      <div className="review2Con" style={{ marginTop: 16 }}>
        <h3>Current Revenue Summary</h3>
        {!canUseIds && (
          <p className="text-gray-600">
            Provide valid <em>payments_main_details_id</em> and a{" "}
            <em>courseBatch_id</em> above.
          </p>
        )}

        {canUseIds && loading && (
          <p className="text-gray-600">Loading record…</p>
        )}

        {canUseIds && !loading && !record && (
          <p className="text-gray-600">
            No record found for the provided IDs. You can create one.
          </p>
        )}

        {record && (
          <div className="step-two-grid aid-request-form-type2">
            <KV k="Course Name" v={record.course_name} />
            <KV k="PMD ID" v={record.payments_main_details_id} />
            <KV k="Batch ID" v={record.courseBatch_id} />
            <KV k="Participants" v={record.no_of_participants} />
            <KV k="Paid Participants" v={record.paid_no_of_participants} />
            <KV k="Total Revenue (CT)" v={record.total_course_revenue} />
            <KV k="Revenue Received" v={record.revenue_received_total} />
            <KV
              k="All Fees Collected"
              v={record.all_fees_collected_status ? "Yes" : "No"}
            />
            <KV k="Updated At" v={record.updated_at} />
          </div>
        )}
      </div>
    </div>
  );
};

const KV = ({ k, v }) => (
  <div className="form-step">
    <div style={{ fontWeight: 600 }}>{k}</div>
    <div>{v ?? "-"}</div>
  </div>
);

export default CourseRevenueSummaryPanel;
