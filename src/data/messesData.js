export const messesData = [
  { 
    id: 1, 
    name: 'Annapoorna Mess', 
    rating: 4.8, 
    reviews: 124, 
    distance: '0.5 km', 
    type: 'South Indian', 
    tag: 'VEG', 
    categories: ['Breakfast', 'Lunch', 'Dinner'], 
    price: '₹2,400',
    fullAddress: 'No. 12, 4th Cross, Malleshwaram, Bengaluru - 560003',
    phone: '+91 98765 43210',
    description: "Authentic South Indian home-cooked meals focusing on healthy and hygienic preparation. Perfect for students wanting comfort food.",
    menu: {
      breakfast: { time: "7:30 AM – 10:00 AM", items: ["Idli (3 pcs)", "Medu Vada", "Coconut Chutney", "Sambar", "Filter Coffee"] },
      lunch: { time: "12:30 PM – 3:00 PM", items: ["White Rice", "Sambar", "Rasam", "2 Veg Sabzis", "Curd", "Papad"] },
      dinner: { time: "7:30 PM – 10:00 PM", items: ["Chapati (3 pcs)", "Rice", "Dal Tadka", "Mix Veg Curry", "Sweet (weekly once)"] }
    },
    pricing: {
      breakfast: 60,
      lunch: 80,
      dinner: 70
    }
  },
  { 
    id: 2, 
    name: 'Spice Garden Mess', 
    rating: 4.5, 
    reviews: 38, 
    distance: '0.8 km', 
    type: 'North Indian', 
    tag: 'NON-VEG', 
    categories: ['Breakfast', 'Lunch', 'Dinner'], 
    price: '₹2,800',
    fullAddress: 'BTM Layout 2nd Stage, Near Water Tank, Bengaluru - 560076',
    phone: '+91 88997 76655',
    description: "Craving North Indian spices? Spice Garden offers both Veg and Non-Veg delicacies with authentic dhaba-style flavors.",
    menu: {
      breakfast: { time: "8:00 AM – 10:30 AM", items: ["Aloo Paratha (2 pcs)", "Poha", "Pickle", "Tea"] },
      lunch: { time: "1:00 PM – 3:30 PM", items: ["Roti (3 pcs)", "Jeera Rice", "Dal Makhani", "Paneer/Chicken Curry", "Salad"] },
      dinner: { time: "8:00 PM – 10:30 PM", items: ["Roti (2 pcs)", "Rice", "Egg Curry", "Mix Veg", "Sweet"] }
    },
    pricing: {
      breakfast: 75,
      lunch: 95,
      dinner: 85
    }
  },
  { 
    id: 3, 
    name: 'Udupi Comfort Meals', 
    rating: 4.7, 
    reviews: 211, 
    distance: '1.2 km', 
    type: 'South Indian', 
    tag: 'VEG', 
    categories: ['Breakfast', 'Lunch', 'Dinner'], 
    price: '₹3,200',
    fullAddress: 'Jayanagar 4th Block, Next to Complex, Bengaluru - 560011',
    phone: '+91 99887 76655',
    description: "Premium pure veg Udupi style meals. Known for excellent hygiene and traditional taste.",
    menu: {
      breakfast: { time: "7:00 AM – 10:00 AM", items: ["Set Dosa", "Chow Chow Bath", "Coconut Chutney", "Filter Coffee"] },
      lunch: { time: "12:00 PM – 3:00 PM", items: ["Full Thali:", "Boiled Rice", "Udupi Sambar", "Saaru", "Palya", "Payasam"] },
      dinner: { time: "7:00 PM – 10:00 PM", items: ["Roti (2 pcs)", "Rice", "Dal", "Special Curry"] }
    },
    pricing: {
      breakfast: 70,
      lunch: 90,
      dinner: 80
    }
  },
  { 
    id: 4, 
    name: 'Raj Bhavan Meals', 
    rating: 4.3, 
    reviews: 78, 
    distance: '1.5 km', 
    type: 'North Indian', 
    tag: 'VEG', 
    categories: ['Breakfast', 'Lunch', 'Dinner'], 
    price: '₹2,500',
    fullAddress: '33, Gandhi Bazaar, Basavanagudi, Bengaluru - 560004',
    phone: '+91 65432 10987',
    description: "Simple, affordable North Indian vegetarian food. A student favorite in the locality.",
    menu: {
      breakfast: { time: "8:00 AM – 10:00 AM", items: ["Paratha (2 pcs)", "Dal Makhani", "Tea"] },
      lunch: { time: "1:00 PM – 3:00 PM", items: ["Rice", "Dal", "Sabzi", "Roti (2 pcs)", "Salad"] },
      dinner: { time: "8:00 PM – 10:00 PM", items: ["Roti (3 pcs)", "Paneer Curry", "Dal", "Rice"] }
    },
    pricing: {
      breakfast: 65,
      lunch: 85,
      dinner: 75
    }
  },
  { 
    id: 5, 
    name: 'Saraswati Home Mess', 
    rating: 4.6, 
    reviews: 142, 
    distance: '0.7 km', 
    type: 'South Indian', 
    tag: 'VEG', 
    categories: ['Breakfast', 'Lunch', 'Dinner'], 
    price: '₹3,300',
    fullAddress: 'Indiranagar 100ft Road, Bengaluru - 560038',
    phone: '+91 77665 54433',
    description: "Feel at home with Saraswati Home Mess. Nutritious food cooked by home-makers.",
    menu: {
      breakfast: { time: "7:30 AM – 10:00 AM", items: ["Upma", "Puliogare", "Chutney", "Coffee"] },
      lunch: { time: "12:30 PM – 3:00 PM", items: ["Red Rice/White Rice", "Sambar", "Majjige Huli", "Veg Fry", "Papad"] },
      dinner: { time: "7:30 PM – 10:00 PM", items: ["Chapati (3 pcs)", "Rice", "Dal", "Curd"] }
    },
    pricing: {
      breakfast: 65,
      lunch: 80,
      dinner: 75
    }
  },
  { 
    id: 6, 
    name: 'Namma Ooru Mess', 
    rating: 4.4, 
    reviews: 89, 
    distance: '2.0 km', 
    type: 'South Indian', 
    tag: 'NON-VEG', 
    categories: ['Breakfast', 'Lunch', 'Dinner'], 
    price: '₹3,000',
    fullAddress: 'Koramangala 1st Block, Bengaluru - 560034',
    phone: '+91 88776 65544',
    description: "Local Bangalore style non-veg and veg meals. Spicy and satisfying.",
    menu: {
      breakfast: { time: "7:30 AM – 10:30 AM", items: ["Thatte Idli", "Masala Dosa", "Filter Coffee"] },
      lunch: { time: "12:30 PM – 3:30 PM", items: ["Rice", "Chicken Sambar", "Veg Sambar", "Rasam", "Papad"] },
      dinner: { time: "7:30 PM – 10:30 PM", items: ["Ragi Mudde (1 pc)", "Chicken Curry", "Rice", "Buttermilk"] }
    },
    pricing: {
      breakfast: 70,
      lunch: 110,
      dinner: 100
    }
  },
  { 
    id: 7, 
    name: 'Mangalore Mess', 
    rating: 4.2, 
    reviews: 55, 
    distance: '1.8 km', 
    type: 'South Indian', 
    tag: 'NON-VEG', 
    categories: ['Breakfast', 'Lunch', 'Dinner'], 
    price: '₹2,500',
    fullAddress: 'Marathahalli Bridge, Bengaluru - 560037',
    phone: '+91 99001 12233',
    description: "Coastal Karnataka cuisine featuring distinct spices and flavors.",
    menu: {
      breakfast: { time: "7:30 AM – 10:00 AM", items: ["Neer Dosa", "Coconut Chutney", "Tea"] },
      lunch: { time: "12:30 PM – 3:00 PM", items: ["Boiled Rice", "Fish Curry (weekly 2 days)", "Dal", "Veg"] },
      dinner: { time: "7:30 PM – 10:00 PM", items: ["Chapati (2 pcs)", "Rice", "Chicken Sukka (weekly once)", "Dal"] }
    },
    pricing: {
      breakfast: 60,
      lunch: 100,
      dinner: 90
    }
  },
  { 
    id: 8, 
    name: 'Krishna Bhavan', 
    rating: 4.5, 
    reviews: 167, 
    distance: '1.0 km', 
    type: 'South Indian', 
    tag: 'VEG', 
    categories: ['Breakfast', 'Lunch', 'Dinner'], 
    price: '₹3,100',
    fullAddress: 'HSR Layout Sector 2, Bengaluru - 560102',
    phone: '+91 88998 87766',
    description: "Highly rated pure vegetarian mess, famous for maintaining quality standard.",
    menu: {
      breakfast: { time: "7:00 AM – 10:00 AM", items: ["Idli", "Vada", "Kesari Bath", "Coffee"] },
      lunch: { time: "12:30 PM – 3:00 PM", items: ["Rice", "Sambar", "Kootu", "Rasam", "Papad"] },
      dinner: { time: "7:00 PM – 10:00 PM", items: ["Dosa/Chapati", "Rice", "Dal", "Curd"] }
    },
    pricing: {
      breakfast: 65,
      lunch: 85,
      dinner: 75
    }
  },
  { 
    id: 9, 
    name: 'Punjabi Dhaba Mess', 
    rating: 4.1, 
    reviews: 63, 
    distance: '2.3 km', 
    type: 'North Indian', 
    tag: 'NON-VEG', 
    categories: ['Breakfast', 'Lunch', 'Dinner'], 
    price: '₹4,000',
    fullAddress: 'Electronic City Phase 1, Bengaluru - 560100',
    phone: '+91 77889 90011',
    description: "Rich and heavy Punjabi meals. Great portions, strictly for big appetites.",
    menu: {
      breakfast: { time: "8:00 AM – 11:00 AM", items: ["Stuffed Parathas", "Curd", "Lassi", "Pickle"] },
      lunch: { time: "1:00 PM – 4:00 PM", items: ["Roti", "Butter Chicken/Paneer Butter Masala", "Dal Makhani", "Jeera Rice"] },
      dinner: { time: "8:00 PM – 11:00 PM", items: ["Naan (2 pcs)", "Mix Veg", "Chole", "Rice"] }
    },
    pricing: {
      breakfast: 80,
      lunch: 120,
      dinner: 110
    }
  }
];
