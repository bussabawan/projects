async function testAPI() {
  try {
    const res = await fetch('http://localhost:3000/api/admin/users?role=1');
    const json = await res.json();
    console.log(JSON.stringify(json, null, 2));
  } catch(e) {
    console.error(e);
  }
}
testAPI();
