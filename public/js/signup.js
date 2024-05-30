document.getElementById('signup-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const first_name = document.getElementById('registerFirstName').value
    const last_name = document.getElementById('registerLastName').value
    const date_of_birth= document.getElementById('registerBirthdate').value
    const date = new Date(date_of_birth)
    const formattedDOB = date.toISOString().split('T')[0];
    console.log(formattedDOB)

    
    
    
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const Confirmpassword = document.getElementById('confirmPassword').value;

    if (Confirmpassword==password) {
        try {
            const response = await fetch('http://localhost:3000/signup', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ username, email, password, date_of_birth, first_name, last_name })
            });
        
            const result = await response.json();
            const messageElement = document.getElementById('signUp');
        
            if (response.ok) {
              messageElement.textContent = 'User created successfully';
              messageElement.className = 'has-text-success';
            } else {
              messageElement.textContent = result.message;
              messageElement.className = 'has-text-danger';
            }
          } catch (error) {
            const messageElement = document.getElementById('message');
            messageElement.textContent = 'Error: ' + error.message;
            messageElement.className = 'has-text-danger';
          }  
    } else {
        alert("Passwords do not Match!")
    }
    
  
   
  });