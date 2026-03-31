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
        "message": "0"
      };
    }
    return await response.json();
  } catch (error) {
    console.log(`GET error: ${String(error)}`);
    return {
      "result": false,
      "message": "0"
    };
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
        "message": "0"
      };
    }
    return await response.json();
  } catch (error) {
    console.log(`POST error: ${String(error)}`);
    return {
      "result": false,
      "message": "0"
    };
  }
}

async function postApiWithFile(url, param, fileInput) {
  const file = fileInput.files[0];
  const formData = new FormData();
  if (file) {
        formData.append("file", file);
  }
  formData.append("json", JSON.stringify(param));
  try {
    const response = await fetch(url, {
      method: "POST",
      credentials: "include",
      body: formData,
    });
    if (!response.ok) {
      console.log(`POST error: ${response.status} ${response.statusText}`);
      return {
        "result": false,
        "message": "0"
      };
    }
    return await response.json();
  } catch (error) {
    console.log(`POST error: ${String(error)}`);
    return {
      "result": false,
      "message": "0"
    };
  }
}

function postApiWithFileOnProgress(url, param, file, el) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const formData = new FormData();
        formData.append("file", file);
        formData.append("json", JSON.stringify(param));

        xhr.open("POST", url);
        xhr.responseType = "json";

        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
                const percent = Math.round((e.loaded / e.total) * 100);
                el.style.width = percent + '%';
            }
        }

        xhr.onload = () =>{
            if (xhr.status === 200) {
                const result = xhr.response;
                resolve(result);
            } else {
                resolve({
                    "result": false,
                    "message": "0"
                });
            }
        }
        xhr.onerror = () => {
            resolve({
                "result": false,
                "message": "0"
            });
        };
        xhr.send(formData);
    })
}