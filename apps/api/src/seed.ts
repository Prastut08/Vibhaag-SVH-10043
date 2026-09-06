import { adminAuth, adminDb } from "./lib/firebase-admin";

async function seed() {
  console.log("🌱 Starting development seed script...");

  // Mock Students
  const mockStudents = [
    { uid: "std_ilesh", name: "Ilesh Kumar", email: "ilesh@vit.ac.in", enrollmentNumber: "21BCE0001", department: "SCOPE", semester: 2 },
    { uid: "std_rakshit", name: "Rakshit Raj", email: "rakshit@vit.ac.in", enrollmentNumber: "21BCE0002", department: "SCOPE", semester: 2 },
    { uid: "std_aryan", name: "Aryan", email: "aryan@vit.ac.in", enrollmentNumber: "21BCE0003", department: "SCOPE", semester: 2 },
    { uid: "std_prastut", name: "Prastut", email: "prastut@vit.ac.in", enrollmentNumber: "21BCE0004", department: "SCOPE", semester: 2 },
    { uid: "std_dilisha", name: "Dilisha", email: "dilisha@vit.ac.in", enrollmentNumber: "21BCE0005", department: "SCOPE", semester: 2 },
  ];

  for (const student of mockStudents) {
    // 1. Create or update user doc in users collection
    await adminDb.collection("users").doc(student.uid).set(
      {
        uid: student.uid,
        name: student.name,
        email: student.email,
        role: "student",
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    // 2. Create or update student profile doc in students collection
    await adminDb.collection("students").doc(student.uid).set(
      {
        id: student.uid,
        name: student.name,
        fullName: student.name,
        email: student.email,
        enrollmentNumber: student.enrollmentNumber,
        department: student.department,
        semester: student.semester,
        status: "active",
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    console.log(`  ✓ Seeded student: ${student.name} (${student.enrollmentNumber})`);
  }

  // Mock Teacher
  const mockTeacher = {
    uid: "teacher_t001",
    name: "Dr. Ananya Roy",
    email: "ananya.roy@vit.ac.in",
    teacherIdentifier: "T001",
    department: "SCOPE",
  };

  await adminDb.collection("users").doc(mockTeacher.uid).set(
    {
      uid: mockTeacher.uid,
      name: mockTeacher.name,
      email: mockTeacher.email,
      role: "teacher",
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );

  await adminDb.collection("teachers").doc(mockTeacher.uid).set(
    {
      id: mockTeacher.uid,
      name: mockTeacher.name,
      email: mockTeacher.email,
      teacherIdentifier: mockTeacher.teacherIdentifier,
      department: mockTeacher.department,
      status: "active",
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
  console.log(`  ✓ Seeded teacher: ${mockTeacher.name} (${mockTeacher.teacherIdentifier})`);

  // Mock FFCS Window
  const windowId = "win_2026_sem2";
  await adminDb.collection("ffcsWindows").doc(windowId).set(
    {
      id: windowId,
      semester: "2",
      academicYear: "2026-27",
      startDateTime: new Date(Date.now() - 3600000).toISOString(),
      endDateTime: new Date(Date.now() + 86400000 * 7).toISOString(),
      status: "open",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
  console.log(`  ✓ Seeded FFCS Window: ${windowId}`);

  // Mock Sample Timetable / Offerings for Teacher T001
  const mockOfferings = [
    {
      id: "off_cs302_mon_slot1",
      windowId,
      semester: "2",
      subjectId: "CS302",
      subjectCode: "CS302",
      subjectName: "Web Development",
      teacherId: mockTeacher.uid,
      teacherName: mockTeacher.name,
      day: "Monday",
      slotId: "slot-1",
      startTime: "08:30",
      endTime: "10:00",
      capacity: 5,
      seatsFilled: 3,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "off_cs302_wed_slot3",
      windowId,
      semester: "2",
      subjectId: "CS302",
      subjectCode: "CS302",
      subjectName: "Web Development",
      teacherId: mockTeacher.uid,
      teacherName: mockTeacher.name,
      day: "Wednesday",
      slotId: "slot-3",
      startTime: "11:40",
      endTime: "13:10",
      capacity: 5,
      seatsFilled: 0,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "off_cs305_fri_slot5",
      windowId,
      semester: "2",
      subjectId: "CS305",
      subjectCode: "CS305",
      subjectName: "Database Systems",
      teacherId: mockTeacher.uid,
      teacherName: mockTeacher.name,
      day: "Friday",
      slotId: "slot-5",
      startTime: "14:50",
      endTime: "16:20",
      capacity: 5,
      seatsFilled: 0,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  for (const offering of mockOfferings) {
    await adminDb.collection("ffcsOfferings").doc(offering.id).set(offering, { merge: true });
    console.log(`  ✓ Seeded Offering: ${offering.subjectCode} (${offering.day} ${offering.slotId})`);
  }

  // Seed sample pending applications for Ilesh, Rakshit, Aryan to CS302 Monday Slot 1
  const targetOffering = mockOfferings[0];
  const pendingStudents = [mockStudents[0], mockStudents[1], mockStudents[2]];

  for (const student of pendingStudents) {
    const appId = `app_${student.uid}_${targetOffering.id}`;
    await adminDb.collection("ffcsApplications").doc(appId).set(
      {
        id: appId,
        windowId,
        studentId: student.uid,
        studentName: student.name,
        semester: "2",
        subjectId: targetOffering.subjectId,
        offeringId: targetOffering.id,
        cgpaSnapshot: 9.2,
        submittedAt: new Date().toISOString(),
        status: "pending",
      },
      { merge: true }
    );
    console.log(`  ✓ Seeded Pending Application: ${student.name} -> ${targetOffering.subjectCode}`);
  }

  console.log("✅ Seed completed successfully!");
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
