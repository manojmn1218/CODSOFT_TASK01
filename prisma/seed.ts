import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding EduManage database with Segregated School & College data...");

  // Clear existing data in correct order
  await prisma.announcement.deleteMany();
  await prisma.fee.deleteMany();
  await prisma.examResult.deleteMany();
  await prisma.exam.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.student.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.class.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash("password123", 10);
  const studentHashedPassword = await bcrypt.hash("student123", 10);

  // 1. MAJOR SUPER ADMIN (Exclusive Access to Principals Hub)
  const superAdmin = await prisma.user.create({
    data: {
      name: "Manoj M N",
      email: "manojmn1218@gmail.com",
      password: hashedPassword,
      role: "ADMIN",
      phone: "+91-70221-59313",
      schoolName: "EduManage Central Headquarters",
    },
  });

  // 2. SCHOOLS / COLLEGES CONFIGURATION
  const institutions = [
    {
      schoolName: "National Public School, Indiranagar",
      principal: { name: "Dr. Rameshwar Sharma, Ph.D.", email: "rameshwar.sharma@edumanage.com", phone: "+91-98450-11221" },
      teachers: [
        { name: "Prof. Rajesh Nair", email: "rajesh.nair@edumanage.com", phone: "+91-98765-43201", empId: "NPS-T101", dept: "Mathematics", qual: "M.Sc., B.Ed. (Mathematics)" },
        { name: "Ms. Priyanka Sharma", email: "priyanka.sharma@edumanage.com", phone: "+91-98765-43202", empId: "NPS-T102", dept: "Physics", qual: "M.Sc. Physics (Gold Medalist)" },
      ],
      classes: [
        { name: "Class 10", section: "A" },
        { name: "Class 10", section: "B" },
      ],
      students: [
        { name: "Aarav Sharma", email: "aarav.sharma@student.edumanage.com", roll: "NPS202401", classIdx: 0, gender: "MALE", dob: "2008-03-15", parent: "Rajesh Sharma", phone: "+91-98451-10001", addr: "42, Shanti Nagar, Bengaluru" },
        { name: "Ananya Verma", email: "ananya.verma@student.edumanage.com", roll: "NPS202402", classIdx: 0, gender: "FEMALE", dob: "2008-07-22", parent: "Sanjay Verma", phone: "+91-98451-10002", addr: "15, Green Glen Layout, Bengaluru" },
        { name: "Rohan Patel", email: "rohan.patel@student.edumanage.com", roll: "NPS202403", classIdx: 1, gender: "MALE", dob: "2008-01-10", parent: "Mukesh Patel", phone: "+91-98451-10003", addr: "88, Indiranagar 100ft Rd, Bengaluru" },
        { name: "Diya Iyer", email: "diya.iyer@student.edumanage.com", roll: "NPS202404", classIdx: 1, gender: "FEMALE", dob: "2008-11-05", parent: "Subramanian Iyer", phone: "+91-98451-10004", addr: "204, Malleshwaram 7th Cross, Bengaluru" },
      ],
    },
    {
      schoolName: "Delhi Public School, Whitefield",
      principal: { name: "Dr. Ananya Deshmukh, M.Ed., Ph.D.", email: "ananya.deshmukh@edumanage.com", phone: "+91-98450-22332" },
      teachers: [
        { name: "Mr. Amitav Sengupta", email: "amitav.sengupta@edumanage.com", phone: "+91-98765-43203", empId: "DPS-T201", dept: "English Literature", qual: "M.A. English Literature, M.Phil." },
        { name: "Dr. Kavita Murthy", email: "kavita.murthy@edumanage.com", phone: "+91-98765-43204", empId: "DPS-T202", dept: "Computer Science", qual: "Ph.D. Computer Science & AI" },
      ],
      classes: [
        { name: "Class 11 - Science", section: "A" },
        { name: "Class 12 - CS", section: "A" },
      ],
      students: [
        { name: "Kabir Mehta", email: "kabir.mehta@student.edumanage.com", roll: "DPS202401", classIdx: 0, gender: "MALE", dob: "2007-06-30", parent: "Harish Mehta", phone: "+91-98451-10005", addr: "51, Koramangala 4th Block, Bengaluru" },
        { name: "Ishaan Gupta", email: "ishaan.gupta@student.edumanage.com", roll: "DPS202402", classIdx: 0, gender: "MALE", dob: "2007-09-18", parent: "Alok Gupta", phone: "+91-98451-10006", addr: "12A, HSR Layout Sector 2, Bengaluru" },
        { name: "Tanvi Joshi", email: "tanvi.joshi@student.edumanage.com", roll: "DPS202403", classIdx: 1, gender: "FEMALE", dob: "2006-08-14", parent: "Mahesh Joshi", phone: "+91-98451-10009", addr: "108, Sadashivanagar, Bengaluru" },
        { name: "Vihaan Rao", email: "vihaan.rao@student.edumanage.com", roll: "DPS202404", classIdx: 1, gender: "MALE", dob: "2006-10-02", parent: "Narasimha Rao", phone: "+91-98451-10010", addr: "65, JP Nagar 6th Phase, Bengaluru" },
      ],
    },
    {
      schoolName: "St. Joseph's Pre-University College",
      principal: { name: "Prof. Vikramaditya Kulkarni", email: "vikram.kulkarni@edumanage.com", phone: "+91-98450-33443" },
      teachers: [
        { name: "Dr. Sreenivasulu Reddy", email: "sreenivasulu.r@edumanage.com", phone: "+91-98765-43205", empId: "SJP-T301", dept: "Chemistry", qual: "Ph.D. Chemistry, PostDoc" },
        { name: "Ms. Anupama Bhatt", email: "anupama.bhatt@edumanage.com", phone: "+91-98765-43206", empId: "SJP-T302", dept: "Biology", qual: "M.Sc. Biotechnology" },
      ],
      classes: [
        { name: "PUC I - PCMB", section: "A" },
        { name: "PUC II - PCMC", section: "A" },
      ],
      students: [
        { name: "Saanvi Kulkarni", email: "saanvi.kulkarni@student.edumanage.com", roll: "SJP202401", classIdx: 0, gender: "FEMALE", dob: "2008-04-25", parent: "Prashant Kulkarni", phone: "+91-98451-10007", addr: "33, Jayanagar 4th T Block, Bengaluru" },
        { name: "Aditya Reddy", email: "aditya.reddy@student.edumanage.com", roll: "SJP202402", classIdx: 1, gender: "MALE", dob: "2007-12-08", parent: "Venkatesh Reddy", phone: "+91-98451-10008", addr: "76, Whitefield Main Road, Bengaluru" },
      ],
    },
    {
      schoolName: "Bishop Cotton Academy, Richmond Town",
      principal: { name: "Dr. Meenakshi Sundaram", email: "meenakshi.s@edumanage.com", phone: "+91-98450-44554" },
      teachers: [
        { name: "Mr. Pradeep Kothari", email: "pradeep.kothari@edumanage.com", phone: "+91-98765-43207", empId: "BCA-T401", dept: "Commerce & Economics", qual: "M.Com., M.Phil." },
      ],
      classes: [
        { name: "Class 9", section: "A" },
      ],
      students: [
        { name: "Nikhil Venkat", email: "nikhil.venkat@student.edumanage.com", roll: "BCA202401", classIdx: 0, gender: "MALE", dob: "2009-02-14", parent: "Venkatraman S", phone: "+91-98451-10011", addr: "90, Richmond Road, Bengaluru" },
      ],
    },
    {
      schoolName: "RV Pre-University College, Jayanagar",
      principal: { name: "Dr. Rajeshwari Hegde", email: "rajeshwari.hegde@edumanage.com", phone: "+91-98450-55665" },
      teachers: [
        { name: "Ms. Shalini Hegde", email: "shalini.hegde@edumanage.com", phone: "+91-98765-43208", empId: "RV-T501", dept: "Electronics & Physics", qual: "M.Tech., B.Ed." },
      ],
      classes: [
        { name: "PUC I - PCME", section: "A" },
      ],
      students: [
        { name: "Pooja Hegde", email: "pooja.hegde@student.edumanage.com", roll: "RV202401", classIdx: 0, gender: "FEMALE", dob: "2008-09-19", parent: "Girish Hegde", phone: "+91-98451-10012", addr: "112, 5th Block Jayanagar, Bengaluru" },
      ],
    },
    {
      schoolName: "Atria Institute of Technology (Atria IT), Bengaluru",
      principal: { name: "Dr. T. N. Sreenivasa, Ph.D. (Principal, Atria IT)", email: "principal@atria.edu", phone: "+91-98450-77889" },
      teachers: [
        { name: "Dr. Ashwin Shenoy", email: "ashwin.shenoy@atria.edu", phone: "+91-98765-50001", empId: "ATRIA-FAC-01", dept: "Computer Science & AI", qual: "Ph.D. AI & Machine Learning" },
        { name: "Prof. Madhavan Krishnan", email: "madhavan.k@atria.edu", phone: "+91-98765-50002", empId: "ATRIA-FAC-02", dept: "Robotics & Automation", qual: "M.Tech. Robotics, Ph.D. Scholar" },
        { name: "Dr. Neha Kulkarni", email: "neha.kulkarni@atria.edu", phone: "+91-98765-50003", empId: "ATRIA-FAC-03", dept: "Electronics & Communication", qual: "Ph.D. VLSI & Embedded Systems" },
      ],
      classes: [
        { name: "B.E. Computer Science (Sem 6)", section: "AI-A" },
        { name: "B.E. Electronics & Comm (Sem 4)", section: "IoT-A" },
        { name: "B.E. Mechanical & Robotics (Sem 8)", section: "Robotics-A" },
      ],
      students: [
        { name: "Aditya V. Sharma", email: "aditya.sharma@atria.edu", roll: "1AT21CS001", classIdx: 0, gender: "MALE", dob: "2003-04-12", parent: "Vikram Sharma", phone: "+91-98451-20001", addr: "82, Basavanagudi Bull Temple Rd, Bengaluru" },
        { name: "Shreya Sundaresan", email: "shreya.s@atria.edu", roll: "1AT21CS002", classIdx: 0, gender: "FEMALE", dob: "2003-09-28", parent: "Sundaresan K", phone: "+91-98451-20002", addr: "14, Banashankari 2nd Stage, Bengaluru" },
        { name: "Harshavardhan Rao", email: "harsha.rao@atria.edu", roll: "1AT22EC015", classIdx: 1, gender: "MALE", dob: "2004-01-15", parent: "Nagesh Rao", phone: "+91-98451-20003", addr: "45, BTM Layout 2nd Stage, Bengaluru" },
        { name: "Meera Nambiar", email: "meera.nambiar@atria.edu", roll: "1AT22EC016", classIdx: 1, gender: "FEMALE", dob: "2004-06-19", parent: "Unnikrishnan Nambiar", phone: "+91-98451-20004", addr: "99, Koramangala 6th Block, Bengaluru" },
        { name: "Karthik Bhat", email: "karthik.bhat@atria.edu", roll: "1AT20ME042", classIdx: 2, gender: "MALE", dob: "2002-11-04", parent: "Shankar Bhat", phone: "+91-98451-20005", addr: "23, Jayanagar 7th Block, Bengaluru" },
        { name: "Ananya Pai", email: "ananya.pai@atria.edu", roll: "1AT23IS010", classIdx: 0, gender: "FEMALE", dob: "2005-08-22", parent: "Ramdas Pai", phone: "+91-98451-20006", addr: "67, Malleshwaram 15th Cross, Bengaluru" },
      ],
    },
  ];

  const feeTypes = ["Tuition Fee", "Lab & Tech Fee", "Sports Fee", "Library Resource Fee"];

  for (const inst of institutions) {
    // A. Create Principal User
    const pUser = await prisma.user.create({
      data: {
        name: inst.principal.name,
        email: inst.principal.email,
        password: hashedPassword,
        role: "PRINCIPAL",
        phone: inst.principal.phone,
        schoolName: inst.schoolName,
      },
    });

    // B. Create Teachers
    const createdTeachers = [];
    for (const t of inst.teachers) {
      const tu = await prisma.user.create({
        data: {
          name: t.name,
          email: t.email,
          password: hashedPassword,
          role: "TEACHER",
          phone: t.phone,
          schoolName: inst.schoolName,
        },
      });
      const tc = await prisma.teacher.create({
        data: {
          userId: tu.id,
          employeeId: t.empId,
          department: t.dept,
          qualification: t.qual,
          schoolName: inst.schoolName,
          joiningDate: new Date("2021-06-01"),
        },
      });
      createdTeachers.push(tc);
    }

    // C. Create Classes
    const createdClasses = [];
    for (let ci = 0; ci < inst.classes.length; ci++) {
      const c = inst.classes[ci];
      const assignedTeacher = createdTeachers[ci % createdTeachers.length];
      const cl = await prisma.class.create({
        data: {
          name: c.name,
          section: c.section,
          schoolName: inst.schoolName,
          academicYear: "2024-25",
          teacherId: assignedTeacher ? assignedTeacher.id : null,
        },
      });
      createdClasses.push(cl);

      // Create Subject for Class
      await prisma.subject.create({
        data: {
          name: `${c.name} Core Subject`,
          code: `SUB-${cl.id.slice(-4).toUpperCase()}`,
          classId: cl.id,
          teacherId: assignedTeacher ? assignedTeacher.id : null,
        },
      });
    }

    // D. Create Students
    for (const s of inst.students) {
      const su = await prisma.user.create({
        data: {
          name: s.name,
          email: s.email,
          password: studentHashedPassword,
          role: "STUDENT",
          phone: s.phone,
          schoolName: inst.schoolName,
        },
      });
      const assignedClass = createdClasses[s.classIdx] || createdClasses[0];
      const st = await prisma.student.create({
        data: {
          userId: su.id,
          rollNumber: s.roll,
          schoolName: inst.schoolName,
          classId: assignedClass ? assignedClass.id : null,
          gender: s.gender,
          dob: s.dob,
          parentName: s.parent,
          parentPhone: s.phone,
          address: s.addr,
          admissionDate: new Date("2024-06-01"),
        },
      });

      // Attendance records (last 20 days)
      const today = new Date();
      for (let d = 19; d >= 0; d--) {
        const date = new Date(today);
        date.setDate(today.getDate() - d);
        date.setHours(0, 0, 0, 0);
        if (date.getDay() === 0 || date.getDay() === 6) continue;

        if (assignedClass) {
          const r = Math.random();
          await prisma.attendance.create({
            data: { studentId: st.id, classId: assignedClass.id, date, status: r > 0.08 ? "PRESENT" : "ABSENT" },
          }).catch(() => {});
        }
      }

      // Fees for student
      for (let month = 0; month < 3; month++) {
        const dueDate = new Date("2024-06-01");
        dueDate.setMonth(dueDate.getMonth() + month * 2);
        const isPaid = Math.random() > 0.25;
        await prisma.fee.create({
          data: {
            studentId: st.id,
            amount: 25000 + Math.floor(Math.random() * 5000),
            type: feeTypes[month % feeTypes.length],
            dueDate,
            paidDate: isPaid ? new Date(dueDate.getTime() - 86400000 * 5) : null,
            status: isPaid ? "PAID" : dueDate < new Date() ? "OVERDUE" : "PENDING",
            description: `${inst.schoolName} — Installment ${month + 1}`,
          },
        });
      }
    }

    // E. Announcement by Principal
    await prisma.announcement.create({
      data: {
        title: `Welcome to ${inst.schoolName}`,
        content: `Academic session 2024-25 is officially in progress at ${inst.schoolName}. Please review your schedule.`,
        target: "ALL",
        schoolName: inst.schoolName,
        createdById: pUser.id,
      },
    });
  }

  console.log("\n✅ Database seeded with segregated school/college data!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
