function MenuItem(options){
  this.id = options.id;
  this.name = options.name;
  this.order = options.order;
  this.pathAlias = options.pathAlias;
  this.breadcrumbs = [];
  this.children = [];
};

exports.MenuItem = MenuItem;