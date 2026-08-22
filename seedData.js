const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const connectDB = require('../config/db');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Payroll = require('../models/Payroll');
const Notification = require('../models/Notification');

const seedDatabase = async () => {
  try {
    await connectDB();

    console.log('[Seed] Clearing existing collections...');
    await User.deleteMany({});
    await Attendance.deleteMany({});
    await Leave.deleteMany({});
    await Payroll.deleteMany({});
    await Notification.deleteMany({});

    console.log('[Seed] Creating demo users...');

    // 1. Admin / HR
    const admin = await User.create({
      employeeId: 'DF-1001',
      fullName: 'Sarah Jenkins',
      email: 'sarah.hr@dayflow.io',
      password: 'Dayflow@2026',
      role: 'admin',
      department: 'Human Resources',
      designation: 'Head of People & Culture',
      employmentType: 'Full-time',
      joiningDate: new Date('2023-01-15'),
      phone: '+1 (555) 412-8821',
      address: {
        street: '450 Mission Street, Suite 800',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94105',
        country: 'United States',
      },
      emergencyContact: {
        name: 'David Jenkins',
        relation: 'Spouse',
        phone: '+1 (555) 412-9900',
      },
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      status: 'Active',
    });

    // 2. Employee 1 - Engineering
    const emp1 = await User.create({
      employeeId: 'DF-1002',
      fullName: 'Alex Chen',
      email: 'alex.chen@dayflow.io',
      password: 'Dayflow@2026',
      role: 'employee',
      department: 'Engineering',
      designation: 'Staff Full-Stack Architect',
      employmentType: 'Full-time',
      joiningDate: new Date('2023-03-01'),
      phone: '+1 (555) 234-5678',
      address: {
        street: '742 Evergreen Terrace',
        city: 'San Jose',
        state: 'CA',
        zipCode: '95123',
        country: 'United States',
      },
      emergencyContact: {
        name: 'Mei Chen',
        relation: 'Sister',
        phone: '+1 (555) 876-5432',
      },
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      status: 'Active',
    });

    // 3. Employee 2 - Design
    const emp2 = await User.create({
      employeeId: 'DF-1003',
      fullName: 'Priya Sharma',
      email: 'priya.sharma@dayflow.io',
      password: 'Dayflow@2026',
      role: 'employee',
      department: 'Design',
      designation: 'Lead Product Designer',
      employmentType: 'Full-time',
      joiningDate: new Date('2023-06-15'),
      phone: '+1 (555) 345-6789',
      address: {
        street: '128 Market Street, Apt 4B',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94103',
        country: 'United States',
      },
      emergencyContact: {
        name: 'Rohan Sharma',
        relation: 'Brother',
        phone: '+1 (555) 765-4321',
      },
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      status: 'Active',
    });

    // 4. Employee 3 - Marketing
    const emp3 = await User.create({
      employeeId: 'DF-1004',
      fullName: 'Marcus Vance',
      email: 'marcus.vance@dayflow.io',
      password: 'Dayflow@2026',
      role: 'employee',
      department: 'Marketing',
      designation: 'Head of Growth Marketing',
      employmentType: 'Full-time',
      joiningDate: new Date('2023-09-01'),
      phone: '+1 (555) 456-7890',
      address: {
        street: '880 Broadway Avenue',
        city: 'Oakland',
        state: 'CA',
        zipCode: '94607',
        country: 'United States',
      },
      emergencyContact: {
        name: 'Elena Vance',
        relation: 'Mother',
        phone: '+1 (555) 654-3210',
      },
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      status: 'Active',
    });

    const allUsers = [admin, emp1, emp2, emp3];
    console.log(`[Seed] Created ${allUsers.length} users successfully.`);

    console.log('[Seed] Generating 30 days of attendance history...');
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayOfWeek = d.getDay();

      // Skip weekends (0 = Sunday, 6 = Saturday)
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;

      const dateString = d.toISOString().split('T')[0];

      for (const user of allUsers) {
        // Today's attendance handled specially (leave some open/not checked in so demo works dynamically)
        if (i === 0) {
          if (user.email === 'priya.sharma@dayflow.io') {
            // Checked in and working today
            const checkIn = new Date(d);
            checkIn.setHours(9, 15, 0, 0);
            await Attendance.create({
              user: user._id,
              dateString,
              date: new Date(dateString),
              checkIn,
              status: 'Present',
              workType: 'Office',
              totalWorkMinutes: 240,
              totalBreakMinutes: 30,
              breaks: [{
                startTime: new Date(new Date(checkIn).getTime() + 2 * 60 * 60 * 1000),
                endTime: new Date(new Date(checkIn).getTime() + 2.5 * 60 * 60 * 1000),
                reason: 'Coffee Break & Brainstorming',
              }],
            });
          }
          // Other users remain not checked in today so demo can punch in!
          continue;
        }

        // Random realistic status for past days
        const rand = Math.random();
        let status = 'Present';
        let checkInHour = 9;
        let checkInMin = Math.floor(Math.random() * 25); // 9:00 - 9:25

        if (rand < 0.08) {
          status = 'Late';
          checkInHour = 9;
          checkInMin = 35 + Math.floor(Math.random() * 20); // 9:35 - 9:55
        } else if (rand < 0.12 && user.email === 'marcus.vance@dayflow.io') {
          status = 'Half-day';
        }

        const checkIn = new Date(d);
        checkIn.setHours(checkInHour, checkInMin, 0, 0);

        const checkOut = new Date(d);
        const workHours = status === 'Half-day' ? 4 : (8 + (Math.random() * 0.8));
        checkOut.setHours(checkInHour + Math.floor(workHours), checkInMin + Math.floor((workHours % 1) * 60), 0, 0);

        const totalBreakMinutes = 45;
        const totalWorkMinutes = Math.round((checkOut - checkIn) / (1000 * 60)) - totalBreakMinutes;

        await Attendance.create({
          user: user._id,
          dateString,
          date: new Date(dateString),
          checkIn,
          checkOut,
          status,
          workType: i % 3 === 0 ? 'Remote' : 'Office',
          totalWorkMinutes: Math.max(0, totalWorkMinutes),
          totalBreakMinutes,
          checkInNote: 'Regular morning punch-in',
          checkOutNote: 'Daily goals completed',
          breaks: [
            {
              startTime: new Date(new Date(checkIn).getTime() + 3.5 * 60 * 60 * 1000),
              endTime: new Date(new Date(checkIn).getTime() + 4.25 * 60 * 60 * 1000),
              reason: 'Lunch break',
            },
          ],
        });
      }
    }

    console.log('[Seed] Generating realistic leave requests...');
    // Leave 1: Alex Chen - Pending Leave (Perfect for HR demo review!)
    const nextWeekStart = new Date(now);
    nextWeekStart.setDate(nextWeekStart.getDate() + 4);
    const nextWeekEnd = new Date(now);
    nextWeekEnd.setDate(nextWeekEnd.getDate() + 6);

    await Leave.create({
      user: emp1._id,
      leaveType: 'Paid',
      startDate: nextWeekStart,
      endDate: nextWeekEnd,
      totalDays: 3,
      reason: 'Attending NextGen Cloud & AI Summit as an invited speaker and engineering research.',
      status: 'Pending',
    });

    // Leave 2: Priya Sharma - Approved Sick Leave
    const pastLeaveStart = new Date(now);
    pastLeaveStart.setDate(pastLeaveStart.getDate() - 15);
    const pastLeaveEnd = new Date(now);
    pastLeaveEnd.setDate(pastLeaveEnd.getDate() - 14);

    await Leave.create({
      user: emp2._id,
      leaveType: 'Sick',
      startDate: pastLeaveStart,
      endDate: pastLeaveEnd,
      totalDays: 2,
      reason: 'Seasonal flu and fever recovery.',
      status: 'Approved',
      reviewedBy: admin._id,
      reviewedAt: new Date(pastLeaveStart.getTime() - 24 * 60 * 60 * 1000),
      reviewComment: 'Take care and get well soon!',
    });

    // Leave 3: Marcus Vance - Rejected Request
    const rejectStart = new Date(now);
    rejectStart.setDate(rejectStart.getDate() - 8);
    const rejectEnd = new Date(now);
    rejectEnd.setDate(rejectEnd.getDate() - 7);

    await Leave.create({
      user: emp3._id,
      leaveType: 'Casual',
      startDate: rejectStart,
      endDate: rejectEnd,
      totalDays: 2,
      reason: 'Personal weekend extension trip.',
      status: 'Rejected',
      reviewedBy: admin._id,
      reviewedAt: new Date(rejectStart.getTime() - 24 * 60 * 60 * 1000),
      reviewComment: 'Critical Q3 Marketing Launch sprint in progress. Please reschedule.',
    });

    console.log('[Seed] Generating payroll records & itemized salary slips...');
    const curYear = now.getFullYear();
    const curMonth = now.getMonth() + 1;
    const prevMonth = curMonth === 1 ? 12 : curMonth - 1;
    const prevYear = curMonth === 1 ? curYear - 1 : curYear;

    const salaryConfigs = [
      { user: admin, basic: 8500, hra: 3000, allow: 1500, bonus: 1000, pf: 850, tax: 1600, ins: 350 },
      { user: emp1, basic: 9500, hra: 3300, allow: 1800, bonus: 1200, pf: 950, tax: 1900, ins: 350 },
      { user: emp2, basic: 7500, hra: 2600, allow: 1200, bonus: 800, pf: 750, tax: 1350, ins: 300 },
      { user: emp3, basic: 7000, hra: 2450, allow: 1100, bonus: 750, pf: 700, tax: 1250, ins: 300 },
    ];

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];

    for (const conf of salaryConfigs) {
      const gross = conf.basic + conf.hra + conf.allow + conf.bonus;
      const deductions = conf.pf + conf.tax + conf.ins;
      const net = gross - deductions;

      // Current month slip (Processed)
      await Payroll.create({
        user: conf.user._id,
        month: curMonth,
        year: curYear,
        periodName: `${monthNames[curMonth - 1]} ${curYear}`,
        salaryStructure: {
          basicSalary: conf.basic,
          hra: conf.hra,
          conveyanceAllowance: 400,
          medicalAllowance: 300,
          specialAllowance: Math.max(0, conf.allow - 700),
          performanceBonus: conf.bonus,
          providentFund: conf.pf,
          taxDeduction: conf.tax,
          healthInsurance: conf.ins,
          otherDeductions: 0,
        },
        grossEarnings: gross,
        totalDeductions: deductions,
        netSalary: net,
        status: 'Processed',
        paymentDate: new Date(),
        workingDays: 22,
        paidDays: 22,
      });

      // Previous month slip (Paid)
      await Payroll.create({
        user: conf.user._id,
        month: prevMonth,
        year: prevYear,
        periodName: `${monthNames[prevMonth - 1]} ${prevYear}`,
        salaryStructure: {
          basicSalary: conf.basic,
          hra: conf.hra,
          conveyanceAllowance: 400,
          medicalAllowance: 300,
          specialAllowance: Math.max(0, conf.allow - 700),
          performanceBonus: conf.bonus,
          providentFund: conf.pf,
          taxDeduction: conf.tax,
          healthInsurance: conf.ins,
          otherDeductions: 0,
        },
        grossEarnings: gross,
        totalDeductions: deductions,
        netSalary: net,
        status: 'Paid',
        paymentDate: new Date(prevYear, prevMonth - 1, 28),
        workingDays: 22,
        paidDays: 22,
      });
    }

    console.log('[Seed] Generating notification feeds...');
    await Notification.create([
      {
        recipient: admin._id,
        title: 'New Leave Request Pending Approval',
        message: 'Alex Chen submitted a 3-day Paid Leave request for the NextGen Cloud & AI Summit.',
        type: 'leave_status',
        actionUrl: 'leaves',
      },
      {
        recipient: emp1._id,
        title: 'Monthly Salary Slip Available',
        message: `Your payslip for ${monthNames[curMonth - 1]} ${curYear} is ready for viewing and export.`,
        type: 'payroll_ready',
        actionUrl: 'payroll',
      },
      {
        recipient: null, // Broadcast
        title: 'Q3 All-Hands Engineering & Product Showcase',
        message: 'Join us this Thursday at 3:00 PM PST in Room Alpha / Zoom for the Q3 Product Innovation Showcase.',
        type: 'announcement',
        actionUrl: 'pulse',
      },
      {
        recipient: emp2._id,
        title: 'Leave Request Approved',
        message: 'Your 2-day Sick Leave request has been approved by Sarah Jenkins.',
        type: 'leave_status',
        actionUrl: 'leaves',
      },
    ]);

    console.log('====================================================');
    console.log('🎉 DAYFLOW SEED DATA GENERATION COMPLETED SUCCESSFULLY!');
    console.log('====================================================');
    console.log('DEMO ACCOUNTS READY:');
    console.log('1. Admin / HR:  sarah.hr@dayflow.io  / Dayflow@2026');
    console.log('2. Employee 1:  alex.chen@dayflow.io / Dayflow@2026 (Engineering)');
    console.log('3. Employee 2:  priya.sharma@dayflow.io / Dayflow@2026 (Design)');
    console.log('4. Employee 3:  marcus.vance@dayflow.io / Dayflow@2026 (Marketing)');
    console.log('====================================================');

    return true;
  } catch (err) {
    console.error('[Seed Error]:', err);
    throw err;
  }
};

// Execute if run directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('[Seed] Finished. Exiting process.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Seed] Failed:', err);
      process.exit(1);
    });
}

module.exports = seedDatabase;
