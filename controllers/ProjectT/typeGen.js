const table = {
  FH: "Full House",
  FR: "First Row",
  SR: "Second Row",
  TR: "Third Row",
};
const typeGen = (type) => {
  var name = table[type] || "Mystery Category";
  return name;
};
exports.typeGen = typeGen;
