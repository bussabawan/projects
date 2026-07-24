import { ManageUsersModel } from './lib/models/manageUsers';

async function test() {
  try {
    const res = await ManageUsersModel.getUsers(1, '', 1, 10);
    console.log("Patients (Role 1):", res);
    const res2 = await ManageUsersModel.getUsers(2, '', 1, 10);
    console.log("Staff (Role 2):", res2);
    const res3 = await ManageUsersModel.getUsers(0, '', 1, 10);
    console.log("Admins? (Role 0):", res3);
  } catch (err) {
    console.error("Error:", err);
  }
  process.exit(0);
}

test();
