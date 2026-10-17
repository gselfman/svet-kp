(function () {
  'use strict';
  function initBooking() {
    var form = document.getElementById('booking-form');
    if (!form || form.getAttribute('data-booking-ready') === 'true') return;
    var begin = document.getElementById('arrival');
    var end = document.getElementById('departure');
    var adults = document.getElementById('adults');
    var go = document.getElementById('booking-submit');
    var status = document.getElementById('booking-error');
    if (!begin || !end || !adults || !go) return;
    var base = 'https://homereserve.ru/PHCstLiK6v';
    function pad(n) { return n < 10 ? '0' + n : String(n); }
    function dateString(date) { return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()); }
    function tomorrow(value) {
      var parts = value.split('-');
      return dateString(new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]) + 1, 12));
    }
    var today = dateString(new Date());
    begin.min = today;
    if (!begin.value) begin.value = today;
    if (!end.value) end.value = tomorrow(begin.value);
    function makeLink() {
      // Construct synchronously from the current controls, including on click.
      var url = base + '?begin_date=' + encodeURIComponent(begin.value)
        + '&end_date=' + encodeURIComponent(end.value)
        + '&adults=' + encodeURIComponent(adults.value);
      go.setAttribute('href', url);
      end.min = begin.value ? tomorrow(begin.value) : tomorrow(today);
      return url;
    }
    function valid() {
      var message = '';
      if (!/^\d{4}-\d{2}-\d{2}$/.test(begin.value) || !/^\d{4}-\d{2}-\d{2}$/.test(end.value)) message = 'Выберите дату заезда и дату выезда.';
      else if (begin.value < today) message = 'Дата заезда не может быть раньше сегодняшнего дня.';
      else if (end.value <= begin.value) message = 'Дата выезда должна быть позже даты заезда.';
      else if (!/^[1-5]$/.test(adults.value)) message = 'Выберите от 1 до 5 гостей.';
      status.textContent = message;
      return message === '';
    }
    function update() { status.textContent = ''; makeLink(); }
    function beginChanged() {
      if (begin.value && (!end.value || end.value <= begin.value)) end.value = tomorrow(begin.value);
      update();
    }
    begin.addEventListener('input', beginChanged);
    begin.addEventListener('change', beginChanged);
    end.addEventListener('input', update);
    end.addEventListener('change', update);
    adults.addEventListener('input', update);
    adults.addEventListener('change', update);
    function follow(event) {
      makeLink();
      if (!valid()) { event.preventDefault(); return; }
      // A normal external link handles navigation; no window.open or asynchronous work.
    }
    go.addEventListener('click', follow);
    form.addEventListener('submit', function (event) {
      makeLink();
      if (!valid()) event.preventDefault();
    });
    makeLink();
    form.setAttribute('data-booking-ready', 'true');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initBooking);
  else initBooking();
  window.addEventListener('pageshow', initBooking);
})();
