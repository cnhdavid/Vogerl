document.getElementById('check-connection').addEventListener('click', async () => {
  const statusElement = document.getElementById('check-connection');
  statusElement.textContent = 'Checking...';

  try {
      const response = await fetch('http://localhost:3000/check-db-connection');
      const result = await response.json();

      if (result.success) {
          statusElement.textContent = 'Database connection is successful';
          statusElement.className = 'has-text-success';
      } else {
          statusElement.textContent = 'Database connection failed: ' + result.message;
          statusElement.className = 'has-text-danger';
          console.log(result.message)
      }
  } catch (error) {
      statusElement.textContent = 'Error: ' + error.message;
      statusElement.className = 'has-text-danger';
      console.log(error.message)
  }
});

