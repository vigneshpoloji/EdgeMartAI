export const DEPARTMENT_FIELDS = {
  electronics: [['model','Model number'],['warranty','Warranty details'],['connectivity','Connectivity']],
  fruits: [['origin','Orchard / origin'],['harvest','Harvest date','date'],['ripeness','Ripeness'],['expiry','Best before','date']],
  vegetables: [['origin','Farm / origin'],['harvest','Harvest date','date'],['expiry','Best before','date'],['storage','Storage instructions']],
  jewellery: [['material','Metal / material'],['purity','Purity'],['weight','Weight'],['certification','Hallmark / certification']],
  meat: [['cut','Cut type'],['storage','Chilled / frozen storage'],['packed','Packed on','date'],['expiry','Use by','date']],
  pharmacy: [['manufacturer','Manufacturer'],['batch','Batch number'],['expiry','Expiry date','date'],['composition','Composition'],['storage','Storage instructions'],['coldChain','Cold chain required','select',['Not specified','Yes','No']]],
  groceries: [['brand','Brand'],['batch','Batch number'],['expiry','Best before','date'],['ingredients','Ingredients'],['storage','Storage instructions']],
  books: [['author','Author'],['isbn','ISBN'],['format','Format'],['language','Language'],['condition','Condition','select',['New','Used — like new','Used — good','Used — acceptable']]],
  food: [['prepTime','Preparation time (minutes)','number'],['allergens','Allergens (comma separated)'],['diet','Diet','select',['Not specified','Vegetarian','Non-vegetarian','Vegan']],['ingredients','Ingredients']],
  plants: [['botanicalName','Botanical name'],['light','Light requirements'],['water','Watering instructions'],['petSafe','Pet safety classification','select',['Not specified','Yes','No']],['pot','Included pot / plant size']],
};
export const PRODUCT_CATEGORIES = {
  electronics:[['Computer Peripherals','Computer peripherals'],['Audio & Headphones','Audio & headphones'],['Cameras & Streaming','Cameras & streaming'],['Keyboards & Mice','Keyboards & mice']],
  fruits:[['daily','Everyday fruit'],['exotic','Exotic fruit'],['citrus','Citrus & berries'],['boxes','Fruit boxes']],
  vegetables:[['daily','Everyday vegetables'],['leafy','Leafy greens'],['exotic','Exotic vegetables'],['roots','Root vegetables']],
  jewellery:[['rings','Rings'],['necklaces','Necklaces'],['earrings','Earrings'],['bangles','Bangles']],
  meat:[['chicken','Chicken'],['mutton','Lamb & goat'],['fish','Seafood'],['ready','Ready to cook']],
  pharmacy:[['medicines','Medicines'],['devices','Devices'],['wellness','Wellness'],['ayurveda','Ayurveda']],
  groceries:[['oils','Oils & ghee'],['staples','Staples'],['dryfruits','Nuts & seeds'],['beverages','Tea & coffee'],['spices','Spices']],
  books:[['fiction','Fiction'],['nonfiction','Non-fiction'],['education','Education']],
  food:[['starters','Starters'],['main','Main course'],['biryani','Biryani'],['pizzas','Pizzas'],['desserts','Desserts']],
  plants:[['indoor','Indoor'],['outdoor','Outdoor'],['flowering','Flowering'],['succulents','Succulents']],
};
