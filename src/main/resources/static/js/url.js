async function getApi(url) {
  try {
    const response = await fetch(url, {
      method: "GET",
      credentials: "include"
    });
    if (!response.ok) {
      console.log(`GET error: ${response.status} ${response.statusText}`);
      return {
        "result": false,
        "msg": `GET error: ${response.status} ${response.statusText}`
      };
    }
    return await response.json();
  } catch (error) {
    console.log(`GET error: ${String(error)}`);
    return {
        "result": false,
        "msg": `GET error: ${String(error)}`
      };;
  }
}

async function postApi(url, param) {
  try {
    const response = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(param),
    });
    if (!response.ok) {
      console.log(`POST error: ${response.status} ${response.statusText}`);
      return {
        "result": false,
        "msg": `POST error: ${response.status} ${response.statusText}`
      };
    }
    return await response.json();
  } catch (error) {
    console.log(`POST error: ${String(error)}`);
      return {
        "result": false,
        "msg": `POST error: ${String(error)}`
      };
  }
}
