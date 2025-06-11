(function () {
  elList = [];
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
    const lectuer = document.querySelectorAll('#lecture-room-container');
    if (lectuer.length === 0) {
      observeContinuously('#root main button', '라이브 강의실 참여하기', () => {
        observeContinuously('div.MuiDialog-root button', '입장하기');
        // 모든 동작 후 dataset._autoClicked 속성을 초기화
        setTimeout(() => {
          elList.forEach((el) => {
            console.log(`${el}`);
            el.dataset._autoClicked = '';
          });
          elList = [];
        }, 200);
      });
    }
  }

  setInterval(start, 500); // 매 0.5초마다 실행
})();
