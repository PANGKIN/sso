window.onload = () => {
  document.getElementById('submitButton').onclick = validateForm;
  Array.from(document.getElementsByClassName('input')).map((v) => {
    v.addEventListener('focusout', onFocusout);
  });
};

const translate = {
  id: '아이디를',
  password: '비밀번호를',
  email: '이메일을',
  nickname: '닉네임을',
};

const validateFunctions = {
  id: (currentTarget) => {
    let element;
    if (currentTarget.constructor === HTMLInputElement) element = currentTarget;
    else if (currentTarget.constructor === String)
      element = document.getElementById(currentTarget);
    else return false;

    const message = document.getElementById(`formmessage-${element.name}`);

    if (element.value.length < 5) {
      message.innerHTML = '5글자 이상 입력해주세요.';
      return false;
    } else if (!/^[a-zA-Z0-9]+$/.test(element.value)) {
      message.innerHTML = '알파벳과 숫자만 사용 가능합니다.';
      return false;
    }
    return fetch(`/join/confirm/${element.name}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=utf-8',
      },
      body: JSON.stringify({
        value: element.value,
      }),
    }).then(async (value) => {
      const response = await value.json();
      if (response.success) {
        message.innerHTML = '';
        return true;
      } else {
        message.innerHTML = response.message;
        return false;
      }
    });
  },
  nickname: (currentTarget) => {
    let element;
    if (currentTarget.constructor === HTMLInputElement) element = currentTarget;
    else if (currentTarget.constructor === String)
      element = document.getElementById(currentTarget);
    else return false;

    const message = document.getElementById(`formmessage-${element.name}`);

    if (element.value.length < 2) {
      message.innerHTML = '2글자 이상 입력해주세요.';
      return false;
    } else if (!/^[가-힣a-zA-Z0-9]+$/.test(element.value)) {
      message.innerHTML = '한글과 알파벳, 숫자만 사용 가능합니다.';
      return false;
    }
    return fetch(`/join/confirm/${element.name}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=utf-8',
      },
      body: JSON.stringify({
        value: element.value,
      }),
    }).then(async (value) => {
      const response = await value.json();
      if (response.success) {
        message.innerHTML = '';
        return true;
      } else {
        message.innerHTML = response.message;
        return false;
      }
    });
  },
  password: (currentTarget) => {
    let element;
    if (currentTarget.constructor === HTMLInputElement) element = currentTarget;
    else if (currentTarget.constructor === String)
      element = document.getElementById(currentTarget);
    else return false;

    const message = document.getElementById(`formmessage-${element.name}`);

    if (element.value.length < 8) {
      message.innerHTML = '8글자 이상 입력해주세요.';
      return false;
    } else if (!/^[a-zA-Z0-9\(#?!@$%^&*\-\)]+$/.test(element.value)) {
      message.innerHTML = `알파벳과 숫자, 특수문자만 사용 가능합니다. <br>
        특수문자: #, ?, !, @, $, %, ^, &, *, (, ), -`;
      return false;
    }
    message.innerHTML = '';
    return true;
  },
  passwordCheck: (currentTarget) => {
    let element;
    if (currentTarget.constructor === HTMLInputElement) element = currentTarget;
    else if (currentTarget.constructor === String)
      element = document.getElementById(currentTarget);
    else return false;

    const message = document.getElementById(`formmessage-${element.name}`);

    if (currentTarget.value === document.getElementById('password').value) {
      message.innerHTML = '';
      return true;
    } else {
      message.innerHTML = '비밀번호가 일치하지 않습니다.';
      return false;
    }
  },
  email: (currentTarget) => {
    let element;
    if (currentTarget.constructor === HTMLInputElement) element = currentTarget;
    else if (currentTarget.constructor === String)
      element = document.getElementById(currentTarget);
    else return false;

    const message = document.getElementById(`formmessage-${element.name}`);

    if (
      !/^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*.[a-zA-Z]{2,3}$/i.test(
        element.value
      )
    ) {
      message.innerHTML = '이메일 형식에 맞지 않습니다.';
      return false;
    } else {
      message.innerHTML = '';
      return true;
    }
  },
};

function onFocusout(e) {
  validateFunctions[e.currentTarget.name](e.currentTarget);
}

async function validateForm() {
  const form = document.joinform;
  const entries = Object.entries(validateFunctions);

  let success = true;
  for (let i = 0; i < entries.length; i++) {
    let result = entries[i][1](form[entries[i][0]]);

    if (result instanceof Promise) {
      result = await result;
    }
    if (!result) success = false;
  }

  if (success) {
    form.passwordCheck.disabled = true;
    form.submit();
  }
}
