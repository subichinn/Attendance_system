import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [students, setStudents] = useState([]);

  useEffect(() => {
    getStudents();
  }, []);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  // Fetch students and today's attendance
  const getStudents = async () => {
    try {
      const [studentsRes, attendanceRes] = await Promise.all([
        fetch(`${API_URL}/students`),
        fetch(`${API_URL}/attendance`),
      ]);

      const studentsData = await studentsRes.json();
      const attendanceData = await attendanceRes.json();

      console.log("Students Data:", studentsData);
      console.log("Attendance Data:", attendanceData);

      const attendanceMap = {};

      attendanceData.forEach((record) => {
        // Skip invalid records
        if (!record || !record.studentId) return;

        const sId =
          typeof record.studentId === "object"
            ? record.studentId._id
            : record.studentId;

        if (sId) {
          attendanceMap[sId] = record.status;
        }
      });

      const updatedStudents = studentsData.map((student) => ({
        ...student,
        attendance: attendanceMap[student._id] || "",
      }));

      setStudents(updatedStudents);
    } catch (err) {
      console.log("Error fetching data:", err);
    }
  };

  // Save attendance
  const saveAttendance = async (studentId, status) => {
    try {
      await fetch(`${API_URL}/attendance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId,
          status,
          date: new Date().toISOString().split("T")[0],
        }),
      });
    } catch (err) {
      console.log("Error saving attendance:", err);
    }
  };

  // Update UI immediately
  const markAttendance = (id, status) => {
    setStudents(
      students.map((student) =>
        student._id === id
          ? {
              ...student,
              attendance: status,
            }
          : student
      )
    );
  };

  // Counts
  const presentCount = students.filter(
    (student) => student.attendance === "P"
  ).length;

  const absentCount = students.filter(
    (student) => student.attendance === "A"
  ).length;

  // Reset Attendance
  const resetAttendance = async () => {
    try {
      const response = await fetch(
        `${API_URL}/attendance/today`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to reset");
      }

      setStudents(
        students.map((student) => ({
          ...student,
          attendance: "",
        }))
      );
    } catch (err) {
      console.log("Error resetting:", err);
      alert("Unable to reset attendance");
    }
  };

  return (
    <div className="container">
      <h1>ATTENDANCE MANAGEMENT SYSTEM</h1>

      {/* SUMMARY */}
      <div className="summary">
        <div className="card present-card">
          Total Present : {presentCount}
        </div>

        <div className="card absent-card">
          Total Absent : {absentCount}
        </div>

        <button
          className="reset-btn"
          onClick={resetAttendance}
        >
          Reset All
        </button>
      </div>

      {/* TABLE */}
      <table>
        <thead>
          <tr>
            <th>ROLL NO</th>
            <th>NAME</th>
            <th>ACTIONS</th>
            <th>STATUS</th>
          </tr>
        </thead>

        <tbody>
          {students.length === 0 ? (
            <tr>
              <td
                colSpan="4"
                style={{ textAlign: "center" }}
              >
                No Students Found
              </td>
            </tr>
          ) : (
            students.map((student) => (
              <tr key={student._id}>
                <td>{student.rollNo}</td>

                <td>{student.name}</td>

                {/* ACTIONS */}
                <td>
                  <button
                    className={`present-btn ${
                      student.attendance === "P"
                        ? "active-p"
                        : ""
                    }`}
                    onClick={() => {
                      markAttendance(
                        student._id,
                        "P"
                      );
                      saveAttendance(
                        student._id,
                        "P"
                      );
                    }}
                  >
                    P
                  </button>

                  <button
                    className={`absent-btn ${
                      student.attendance === "A"
                        ? "active-a"
                        : ""
                    }`}
                    onClick={() => {
                      markAttendance(
                        student._id,
                        "A"
                      );
                      saveAttendance(
                        student._id,
                        "A"
                      );
                    }}
                  >
                    A
                  </button>
                </td>

                {/* STATUS */}
                <td>
                  <span
                    className={`status ${
                      student.attendance === "P"
                        ? "status-p"
                        : student.attendance === "A"
                        ? "status-a"
                        : "status-empty"
                    }`}
                  >
                    {student.attendance || "-"}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default App;