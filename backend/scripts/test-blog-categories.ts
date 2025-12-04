
async function testBlogCategories() {
  try {
    console.log('Testing GET /api/blog-categories...');
    const response = await fetch('http://localhost:5000/api/blog-categories');
    console.log('Status:', response.status);
    const data = await response.json();
    console.log('Data:', data);

    console.log('Testing GET /api/blog-categories/123...');
    const response2 = await fetch('http://localhost:5000/api/blog-categories/123');
    console.log('Status 2:', response2.status);
    const data2 = await response2.json();
    console.log('Data 2:', data2);

  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

testBlogCategories();
