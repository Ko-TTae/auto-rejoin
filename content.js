(function () {
  let manualListenerRegistered = false;
  let registrationInProgress = false;

  // iframe 내부 버튼 찾기 유틸
  function getIframeDoc() {
    const aside = document.getElementById('elice-community-app');
    if (!aside) {
      return null;
    }
    const targetIframe = aside.querySelector('iframe');
    if (!targetIframe) {
      console.warn('iframe 요소를 찾을 수 없습니다.');
      return null;
    }
    try {
      return (
        targetIframe.contentDocument || targetIframe.contentWindow.document
      );
    } catch {
      console.warn('Cross-origin iframe 접근 불가');
      return null;
    }
  }

  // 퇴장 버튼 클릭 시 자동 입장 비활성화
  function observeExitButton() {
    const doc = getIframeDoc();
    if (!doc) return;

    const exitButton = Array.from(doc.querySelectorAll('button')).find((btn) =>
      btn.innerText.includes('퇴장')
    );

    if (!exitButton || exitButton.dataset._observed === 'true') return;

    exitButton.addEventListener('click', () => {
      console.log('사용자가 퇴장 → 자동 입장 비활성화');
      chrome.storage.local.set({ autoJoinEnabled: false });
      addManualJoinListener();

      // 퇴장 버튼 클릭 시 리스너 제거
      exitButton.removeEventListener('click', arguments.callee);
      exitButton.dataset._observed = '';
      delete exitButton.dataset._observed;
    });
    exitButton.dataset._observed = 'true';
  }

  function addManualJoinListener() {
    if (manualListenerRegistered || registrationInProgress) {
      console.log('이미 수동입장 리스너가 등록되어 있습니다.');
      return;
    }
    console.log('수동입장 리스너 등록 시도');
    registrationInProgress = true; // 등록 시도 중 플래그 설정

    const doc = getIframeDoc();
    if (!doc) {
      registrationInProgress = false; // iframe 문서 접근 실패 시 재시도 가능하도록
      return;
    }

    // 실제 버튼 찾기 함수
    const findAndSetupJoinButton = () => {
      const joinButton = Array.from(doc.querySelectorAll('button')).find(
        (btn) => btn.innerText.includes('입장하기')
      );

      if (joinButton) {
        const handler = () => {
          console.log('사용자가 입장 → 자동 입장 기능 재활성화');
          joinButton.removeEventListener('click', handler);
          chrome.storage.local.set({ autoJoinEnabled: true });
          manualListenerRegistered = false; // 다시 등록 가능하게 설정
          registrationInProgress = false; // 등록 시도 플래그도 초기화
        };
        joinButton.addEventListener('click', handler);
        console.log('수동입장 리스너 등록 완료!');
        manualListenerRegistered = true; // 등록 성공 시에만 플래그 설정
        return true;
      }
      return false;
    };

    // 바로 시도 후, 못 찾으면 주기적으로 재시도
    if (!findAndSetupJoinButton()) {
      console.log('입장하기 버튼을 찾지 못함, 1초마다 재시도...');
      const intervalId = setInterval(() => {
        if (findAndSetupJoinButton()) {
          clearInterval(intervalId);
        }
      }, 1000);
    }
  }

  let elList = [];
  function observeContinuously(selector, textIncludes, onMatch) {
    const tryClick = () => {
      const elements = document.querySelectorAll(selector);
      for (const el of elements) {
        if (el.innerText.includes(textIncludes) && !el.dataset._autoClicked) {
          console.log(`✅ '${textIncludes}' 버튼 클릭`);
          el.click();
          el.dataset._autoClicked = 'true';
          elList.push(el);
          onMatch?.();
        }
      }
    };

    tryClick();
  }

  function start() {
    const lecture = document.querySelectorAll('#lecture-room-container');
    if (lecture.length === 0) {
      observeContinuously('#root main button', '라이브 강의실 참여하기', () => {
        observeContinuously('div.MuiDialog-root button', '입장하기');
        // 모든 동작 후 dataset._autoClicked 속성을 초기화
        setTimeout(() => {
          elList.forEach((el) => {
            console.log(`${el}`);
            el.dataset._autoClicked = '';
            delete el.dataset._autoClicked;
          });
          elList = [];
        }, 200);
      });
    }
  }

  // 매 0.5초마다 반복 실행
  setInterval(() => {
    chrome.storage.local.get('autoJoinEnabled', (data) => {
      if (data.autoJoinEnabled !== false) {
        start();
      } else {
        // 자동 입장 기능 비활성화 → 리스너 등록
        if (!manualListenerRegistered && !registrationInProgress) {
          addManualJoinListener();
        }
      }
    });
  }, 500);

  // 화면이 업데이트 될 때마다 observeExitButton 실행
  const observer = new MutationObserver(() => {
    observeExitButton();
  });
  const root = document.getElementById('root') || document.body;
  observer.observe(root, { childList: true, subtree: true });
  // 최초 1회 실행
  observeExitButton();
})();
