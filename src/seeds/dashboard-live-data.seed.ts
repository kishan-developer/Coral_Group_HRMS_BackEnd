import dotenv from 'dotenv';
import { Department } from '../models/department.model';
import { Employee } from '../models/employee.model';
import { Attendance } from '../models/attendance.model';
import { Leave } from '../models/leave.model';
import { Reimbursement } from '../models/reimbursement.model';
import { connectDatabase } from '../config/database.config';

dotenv.config();

const seedDashboardData = async () => {
  try {
    const connected = await connectDatabase();
    if (!connected) {
      console.error('Failed to connect to database. Aborting seed.');
      process.exit(1);
    }

    console.log('🌱 Seeding Live Database Data for HRMS Dashboard...');

    // 1. Create Departments
    const deptNames = [
      { name: 'Real Estate', description: 'Real Estate Development & Site Operations', location: 'Site A' },
      { name: 'Hotels', description: 'Hospitality & Guest Management', location: 'Hotel Blue' },
      { name: 'Saree Mfg', description: 'Saree Manufacturing & Production', location: 'Factory 1' },
      { name: 'Corporate HO', description: 'Corporate Head Office & Admin', location: 'HO' },
    ];

    const seededDepts = [];
    for (const d of deptNames) {
      let dept = await Department.findOne({ name: d.name });
      if (!dept) {
        dept = await Department.create(d);
      }
      seededDepts.push(dept);
    }
    console.log(`✅ ${seededDepts.length} Departments ensured.`);

    // 2. Create Sample Employees across Departments
    const sampleEmployeesData = [
      // Real Estate
      { firstName: 'Rahul', lastName: 'Sharma', email: 'rahul.sharma@coral-group.in', deptName: 'Real Estate', workType: 'On Field' },
      { firstName: 'Vikram', lastName: 'Rao', email: 'vikram.rao@coral-group.in', deptName: 'Real Estate', workType: 'On Field' },
      { firstName: 'Suresh', lastName: 'Patil', email: 'suresh.patil@coral-group.in', deptName: 'Real Estate', workType: 'Office' },
      { firstName: 'Ramesh', lastName: 'Verma', email: 'ramesh.verma@coral-group.in', deptName: 'Real Estate', workType: 'Office' },
      { firstName: 'Karan', lastName: 'Mehta', email: 'karan.mehta@coral-group.in', deptName: 'Real Estate', workType: 'On Field' },

      // Hotels
      { firstName: 'Priya', lastName: 'Patel', email: 'priya.patel@coral-group.in', deptName: 'Hotels', workType: 'Office' },
      { firstName: 'Anita', lastName: 'Deshmukh', email: 'anita.deshmukh@coral-group.in', deptName: 'Hotels', workType: 'Office' },
      { firstName: 'Deepak', lastName: 'Joshi', email: 'deepak.joshi@coral-group.in', deptName: 'Hotels', workType: 'On Field' },
      { firstName: 'Sunita', lastName: 'Rao', email: 'sunita.rao@coral-group.in', deptName: 'Hotels', workType: 'Office' },

      // Saree Mfg
      { firstName: 'Amit', lastName: 'Kumar', email: 'amit.kumar@coral-group.in', deptName: 'Saree Mfg', workType: 'Office' },
      { firstName: 'Rajesh', lastName: 'Singh', email: 'rajesh.singh@coral-group.in', deptName: 'Saree Mfg', workType: 'Office' },
      { firstName: 'Manoj', lastName: 'Tiwari', email: 'manoj.tiwari@coral-group.in', deptName: 'Saree Mfg', workType: 'Office' },
      { firstName: 'Pooja', lastName: 'Shah', email: 'pooja.shah@coral-group.in', deptName: 'Saree Mfg', workType: 'Office' },

      // Corporate HO
      { firstName: 'Sneha', lastName: 'Gupta', email: 'sneha.gupta@coral-group.in', deptName: 'Corporate HO', workType: 'Office' },
      { firstName: 'Manish', lastName: 'Sharma', email: 'manish.sharma@coral-group.in', deptName: 'Corporate HO', workType: 'Office' },
      { firstName: 'Kishan', lastName: 'Ray', email: 'kishan.ray@coral-group.in', deptName: 'Corporate HO', workType: 'Office' },
      { firstName: 'Neha', lastName: 'Agarwal', email: 'neha.agarwal@coral-group.in', deptName: 'Corporate HO', workType: 'Remote' },
      { firstName: 'Vikas', lastName: 'Dubey', email: 'vikas.dubey@coral-group.in', deptName: 'Corporate HO', workType: 'Office' },
    ];

    const seededEmployees = [];
    for (let i = 0; i < sampleEmployeesData.length; i++) {
      const empInfo = sampleEmployeesData[i];
      const dept = seededDepts.find(d => d.name === empInfo.deptName);
      const empId = `EMP${1001 + i}`;

      let emp = await Employee.findOne({ email: empInfo.email });
      if (!emp) {
        emp = await Employee.create({
          employeeId: empId,
          firstName: empInfo.firstName,
          lastName: empInfo.lastName,
          email: empInfo.email,
          joiningDate: new Date(Date.now() - (i * 15 * 24 * 60 * 60 * 1000)),
          departmentId: dept ? dept._id.toString() : undefined,
          status: 'Active',
          workType: empInfo.workType as any,
          phone: `987654321${i}`,
        });
      }
      seededEmployees.push(emp);
    }
    console.log(`✅ ${seededEmployees.length} Employees ensured in live database.`);

    // 3. Clear existing attendance & seed today's attendance records
    await Attendance.deleteMany({});

    const today = new Date();
    today.setHours(9, 0, 0, 0);

    const attendanceRecords = [
      { empIndex: 0, status: 'Present', punchInTime: '09:01 AM', location: 'Site A - Field Location', totalHours: 8.5 },
      { empIndex: 1, status: 'Late', punchInTime: '09:18 AM', location: 'Site B - Construction Ground', totalHours: 7.8 },
      { empIndex: 2, status: 'Present', punchInTime: '08:58 AM', location: 'Real Estate Office', totalHours: 8.0 },
      { empIndex: 3, status: 'Present', punchInTime: '09:00 AM', location: 'Real Estate Office', totalHours: 8.0 },
      { empIndex: 4, status: 'Present', punchInTime: '09:05 AM', location: 'Field Project Site C', totalHours: 8.2 },

      { empIndex: 5, status: 'Present', punchInTime: '09:05 AM', location: 'Hotel Blue Front Desk', totalHours: 8.0 },
      { empIndex: 6, status: 'Present', punchInTime: '08:55 AM', location: 'Hotel Blue Admin', totalHours: 8.5 },
      { empIndex: 7, status: 'Present', punchInTime: '09:10 AM', location: 'Field Vendor Visit', totalHours: 8.0 },
      { empIndex: 8, status: 'Absent', punchInTime: undefined, location: undefined, totalHours: 0 },

      { empIndex: 9, status: 'Late', punchInTime: '09:22 AM', location: 'Factory 1 Production Floor', totalHours: 7.5 },
      { empIndex: 10, status: 'Present', punchInTime: '08:50 AM', location: 'Factory 1 Office', totalHours: 8.5 },
      { empIndex: 11, status: 'Present', punchInTime: '09:02 AM', location: 'Factory 1 Office', totalHours: 8.0 },
      { empIndex: 12, status: 'Leave', punchInTime: undefined, location: undefined, totalHours: 0 },

      { empIndex: 13, status: 'Present', punchInTime: '08:55 AM', location: 'HO Main Building', totalHours: 8.5 },
      { empIndex: 14, status: 'Present', punchInTime: '09:00 AM', location: 'HO Conference Room', totalHours: 8.0 },
      { empIndex: 15, status: 'Present', punchInTime: '08:45 AM', location: 'HO Executive Floor', totalHours: 9.0 },
      { empIndex: 16, status: 'Present', punchInTime: '09:00 AM', location: 'Remote Home Network', totalHours: 8.0 },
      { empIndex: 17, status: 'Late', punchInTime: '09:15 AM', location: 'HO IT Desk', totalHours: 7.8 },
    ];

    for (const record of attendanceRecords) {
      const emp = seededEmployees[record.empIndex];
      if (emp) {
        await Attendance.create({
          employeeId: emp.employeeId,
          date: today,
          punchInTime: record.punchInTime,
          punchOutTime: record.status !== 'Absent' && record.status !== 'Leave' ? '06:00 PM' : undefined,
          punchInLocation: record.location ? { latitude: 19.076, longitude: 72.8777, address: record.location } : undefined,
          totalHours: record.totalHours,
          status: record.status as any,
        });
      }
    }
    console.log(`✅ ${attendanceRecords.length} Attendance records seeded into live database.`);

    // 4. Seed Leave Records
    await Leave.deleteMany({});
    const leaveEntries = [
      { empIndex: 12, leaveType: 'Sick Leave', totalDays: 2, reason: 'Viral Fever', status: 'Approved' },
      { empIndex: 8, leaveType: 'Casual Leave', totalDays: 1, reason: 'Personal work', status: 'Pending' },
      { empIndex: 3, leaveType: 'Earned Leave', totalDays: 3, reason: 'Family event', status: 'Approved' },
    ];

    for (const l of leaveEntries) {
      const emp = seededEmployees[l.empIndex];
      if (emp) {
        await Leave.create({
          employeeId: emp.employeeId,
          leaveType: l.leaveType as any,
          fromDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
          toDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
          totalDays: l.totalDays,
          reason: l.reason,
          status: l.status as any,
        });
      }
    }
    console.log(`✅ ${leaveEntries.length} Leave applications seeded.`);

    // 5. Seed Reimbursements
    await Reimbursement.deleteMany({});
    const reimbursements = [
      { empIndex: 0, claimType: 'Travel Allowance', amountClaimed: 1500, description: 'Field Travel Allowance', status: 'Approved' },
      { empIndex: 7, claimType: 'Food & Entertainment', amountClaimed: 850, description: 'Client Lunch Expense', status: 'Pending' },
      { empIndex: 15, claimType: 'Office Supplies', amountClaimed: 2300, description: 'Office Stationeries', status: 'Approved' },
    ];

    for (const r of reimbursements) {
      const emp = seededEmployees[r.empIndex];
      if (emp) {
        await Reimbursement.create({
          employeeId: emp.employeeId,
          claimType: r.claimType,
          amountClaimed: r.amountClaimed,
          description: r.description,
          claimDate: new Date(),
          submittedOn: new Date(),
          status: r.status as any,
        });
      }
    }
    console.log(`✅ ${reimbursements.length} Reimbursement records seeded.`);

    console.log('\n🎉 ALL LIVE DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding live dashboard data:', err);
    process.exit(1);
  }
};

seedDashboardData();
