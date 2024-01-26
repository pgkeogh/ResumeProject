// Wrap your code in a DOMContentLoaded event listener
document.addEventListener("DOMContentLoaded", () => {
  getVisitCount();
});

const localApi = "http://localhost:7071/api/AzResumeTrigger";
const functionApi =
  "https://pkazresumechallenge.azurewebsites.net/api/azresumetrigger";

// Use asynch/await to ensure each step is completed before moving on to the next
const getVisitCount = async () => {
  let count = 0;
  console.log("Before fetch"); // Debug message

  try {
    const response = await fetch(functionApi); // Wait for the fetch request to resolve
    console.log("After fetch"); // Debug message

    const data = await response.json(); // Wait for the response to be parsed as JSON
    console.log("Raw response data:", data); // Debug message

    count = data;
    console.log(count);

    document.getElementById("counter").innerText = `${count}`;
  } catch (error) {
    console.error("Error:", error); // Log any errors that occur during the fetch or parsing
  }

  console.log("Returning count:", count); // Debug message
  return count; // Return the updated count
};
