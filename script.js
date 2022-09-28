'use strict';

// Mapty App

// Data Controlling
class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance; // in km
    this.duration = duration; // in min
  }

  _setDiscription() {
    // prettier-ignore
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    this.Discription = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDiscription();
  }
  calcPace() {
    // min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDiscription();
  }
  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const mobiMenuBtn = document.querySelector('.mobile-menu__btn');
const sideBar = document.querySelector('.sidebar');

// Application Architecture
class App {
  #map;
  #mapEvent;
  #workoutArray = [];
  #mapZoomLevel = 13;
  constructor() {
    this._getPosition();
    //Gets user locaton
    this._getLocalStorage();
    // Gets Data from LocalStorage
    form.addEventListener('submit', this._newWorkout.bind(this));
    // submit workouts on submission
    inputType.addEventListener('change', this._toggleElevationField);
    // gives Functionality to inputtype option
    containerWorkouts.addEventListener(
      'click',
      this._pointLoadedMarker.bind(this)
    );
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          const locationError = document.querySelector('#map');
          locationError.textContent = 'Grant Location Access!';
          locationError.classList.add('location-error');
        }
      );
    document.body.addEventListener('click', function (e) {
      if (e.target.classList.contains('mobile-menu__btn')) {
        sideBar.classList.toggle('hidden');
      }
      if (e.target.classList.contains('workout')) {
        sideBar.classList.remove('hidden');
      }
    });
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    const curCoords = [latitude, longitude];
    this.#map = L.map('map').setView(curCoords, this.#mapZoomLevel);
    L.tileLayer(`https://tile.openstreetmap.org/{z}/{x}/{y}.png`, {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // Handling clicks on map
    this.#map.on('click', this._showForm.bind(this));

    // loads marker for LocalStorage Data
    this.#workoutArray.forEach(work => {
      this._pointMarker(work);
      this._renderWorkouts(work);
    });
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputType.focus();
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    e.preventDefault();
    // Helping functions
    const CheckValueValid = (...inputs) =>
      inputs.every(v => Number.isFinite(v));
    const CheckValuePositive = (...inputs) => inputs.every(v => v > 0);

    //Get the data from (Forms)
    const { lat, lng } = this.#mapEvent.latlng;
    const duration = +inputDuration.value;
    const distance = +inputDistance.value;
    let workout;
    // if Workout is Running / create Running object
    // check if data is valid
    if (inputType.value === 'running') {
      const cadence = +inputCadence.value;
      if (
        !CheckValueValid(duration, distance, cadence) ||
        !CheckValuePositive(distance, cadence, duration)
      )
        return alert('The Value should be a positive number');
      workout = new Running([lat, lng], distance, duration, cadence);
    }

    // if Workout is Cycling / create Cycling object
    // check if data is valid
    if (inputType.value === 'cycling') {
      const elevation = +inputElevation.value;
      if (
        !CheckValueValid(duration, distance, elevation) ||
        !CheckValuePositive(distance, duration)
      )
        return alert('The Value should be a positive number');
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    // Add new object to workout array
    this.#workoutArray.push(workout);

    // Render WorkoutMarker
    this._pointMarker(workout);

    // Render Workout
    this._renderWorkouts(workout);

    // Save workouts in LocalStorage
    this._setLocalStorage();

    // Calling HideForm
    this._hideForm();
  }

  _renderWorkouts(workouts) {
    let html;
    if (workouts.type === 'running') {
      html = `<li class="workout workout--running" data-id="${workouts.id}">
      <h2 class="workout__title">${workouts.Discription}</h2>
      <div class="workout__details">
      <span class="workout__icon">${
        workouts.type === 'running' ? '🏃‍♂️' : '🚴‍♂️'
      }</span>
      <span class="workout__value">${workouts.distance}</span>
      <span class="workout__unit">km</span>
      </div>
      <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workouts.duration}</span>
      <span class="workout__unit">min</span>
      </div>
      <div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workouts.pace.toFixed(1)}</span>
      <span class="workout__unit">min/km</span>
      </div>
      <div class="workout__details">
      <span class="workout__icon">🦶🏼</span>
      <span class="workout__value">${workouts.cadence}</span>
      <span class="workout__unit">spm</span>
    </div>
    </li>`;
    }

    if (workouts.type === 'cycling') {
      html = `<li class="workout workout--${workouts.type}" data-id="${
        workouts.id
      }">
      <h2 class="workout__title">${workouts.Discription}</h2>
      <div class="workout__details">
        <span class="workout__icon">${
          workouts.type === 'cycling' ? '🚴‍♂️' : '🏃‍♂️'
        }</span>
        <span class="workout__value">${workouts.distance}</span>
        <span class="workout__unit">KM</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value">${workouts.duration}</span>
        <span class="workout__unit">MIN</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workouts.speed.toFixed(1)}</span>
        <span class="workout__unit">KM/H</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">🦶🏼</span>
        <span class="workout__value">${workouts.elevationGain}</span>
        <span class="workout__unit">M</span>
      </div>
    </li>`;
    }
    form.insertAdjacentHTML('afterend', html);
  }

  _pointMarker(workout) {
    // Displaying marker
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 150,
          minWidth: 100,
          autoclose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        ` ${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♂️'}${workout.Discription}`
      )
      .openPopup();
  }
  _hideForm() {
    // Clearing input fields
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workoutArray));
  }
  _getLocalStorage() {
    const seededData = JSON.parse(localStorage.getItem('workouts'));

    if (!seededData) return;

    this.#workoutArray = seededData;
  }

  _pointLoadedMarker(e) {
    // if (!this.#map) return;
    const activeEl = e.target.closest('.workout');

    if (!activeEl) return;

    const workout = this.#workoutArray.find(
      work => work.id === activeEl.dataset.id
    );
    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 2,
      },
    });
  }
}

const maptyApp = new App();

// In this challenge you will build a function 'whereAmI' which renders a country ONLY based on GPS coordinates. For that, you will use a second API to geocode coordinates.
// Here are your tasks:
// PART 1
// 1. Create a function 'whereAmI' which takes as inputs a latitude value (lat) and a longitude value (lng) (these are GPS coordinates, examples are below).
// 2. Do 'reverse geocoding' of the provided coordinates. Reverse geocoding means to convert coordinates to a meaningful location, like a city and country name. Use this API to do reverse geocoding: https://geocode.xyz/api.
// The AJAX call will be done to a URL with this format: https://geocode.xyz/52.508,13.381?geoit=json. Use the fetch API and promises to get the data. Do NOT use the getJSON function we created, that is cheating 😉
// 3. Once you have the data, take a look at it in the console to see all the attributes that you recieved about the provided location. Then, using this data, log a messsage like this to the console: 'You are in Berlin, Germany'
// 4. Chain a .catch method to the end of the promise chain and log errors to the console
// 5. This API allows you to make only 3 requests per second. If you reload fast, you will get this error with code 403. This is an error with the request. Remember, fetch() does NOT reject the promise in this case. So create an error to reject the promise yourself, with a meaningful error message.
