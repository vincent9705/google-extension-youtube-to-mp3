const inputField = document.querySelector('input[id="url"]'); // Adjust the selector based on the actual input field
if (inputField) {
    console.log('Filling input field');
    inputField.value = 'Your text here';
    const button = document.querySelector('button'); // Adjust the selector based on the actual button
    if (button) {
        console.log('Clicking button');
        button.click();
    }
}