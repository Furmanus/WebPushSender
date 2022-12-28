const currentDataContainer = document.getElementById('currentDataContainer');
const useCurrentData = document.getElementById('useCurrentData');

useCurrentData.addEventListener('change', (e) => {
  if (e.target.checked) {
    currentDataContainer.classList.add('hidden');
  } else {
    currentDataContainer.classList.remove('hidden');
  }
});
