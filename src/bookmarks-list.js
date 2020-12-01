import $ from 'jquery';

import store from './store';

import api from './api';

const generateItemElement = function (item) {
  function ratingLabel(item) {
    let starsView = []
    if (item.rating > 1) {

      for (let i = 0; i < item.rating; i++) {
        starsView.push(`<label type="radio" checked="checked" class="starView" >☆</label>`)
      }
    }
    return starsView.join(' ')
  }

  let itemTitle = `
      <form id="js-edit-item-form">
        <label for='bookmark-item'>Bookmark Name<br></label>
        <input id='bookmark-item'class="bookmark-item" type="text" value="${item.title}" required/>
      </form> 
      <div class="rating-box">
      ${ratingLabel(item)}
      </div>
      <br>
      <label> Visit site: <a href="${item.url}" target="new_blank">${item.url}</a>
     </label>
        <section class="bookmark-desc">${item.desc}</section>
         <div class="bookmark-item-controls">
        <button class="bookmark-item-toggle js-item-toggle">
          <span class="button-label">ok</span>
        </button>
        <button class="bookmark-item-delete js-item-delete">
          <span class="button-label">delete</span>
        </button>
      
    `;
  if (!item.expanded) {
    itemTitle =
      `<div class="bookmark-box">
    <span class="bookmark-item bookmark-item__expanded">${item.title}</span>
    <div class="rating-box">${ratingLabel(item)}</div></div> `;

  }

  return `
    <li class="js-item-element" data-item-id="${item.id}">
      ${itemTitle}
      
      </div>
    </li>`;
};

const generatebookmarkItemsString = function (bookmarksList) {
  const items = bookmarksList.map((item) => generateItemElement(item));
  return items.join('');
};

const generateError = function (message) {
  return `
  <section class = "error-content">
    <button id = "cancel-error">X</button>
    <p>${message}</p>
    </section>
    `;
};

const renderError = function () {
  if (store.error) {
    const el = generateError(store.error);
    $('.error-container').html(el);
  } else {
    $('.error-container').empty();
  }
};

const handleCloseError = function () {
  $('.main-view').on('click', '#cancel-error', () => {
    store.setError(null);
    renderError();
  });
};

const render = function () {
  renderError();
  // Filter item list by item rating 
  let items = [...store.bookmarks];

  items = items.filter(item => item.rating >= store.filter);


  // render the bookmark list in the DOM
  const bookmarkListItemsString = generatebookmarkItemsString(items);


  //adding this function into render function not into event listeners
  addNewForm();


  // insert that HTML into the DOM
  if (store.adding == false) {
    let html = `<div class="new-bookmark-form"> </div>
    <div class = "my-bookmarks-view">
    <header>
      <h2>My Bookmarks</h2>
      <form id="initial-view">
      <button class="initial-view-new">
        <span class="button-label">New</span>
      </button>
        <select id="ratings" name="ratings">
          <option> <span class="button-label"></span>Filter By</span></option>
          <option value="1">1 star</option>
          <option value="2">2 stars</option>
          <option value="3">3 stars</option>
          <option value="4">4 stars</option>
          <option value="5">5 stars</option>
        </select>
      </form>
      </header>
<ul class="bookmark-list js-bookmark-list"></ul>
    </div>`
    $(".main-view").html(html)
    $('.js-bookmark-list').html(bookmarkListItemsString);
  } else {
    $(".my-bookmarks-view").empty()
  }
};

$.fn.extend({
  serializeJson: function () {
    const formData = new FormData(this[0]);
    const o = {};
    formData.forEach((val, name) => o[name] = val);
    return JSON.stringify(o);
  }
});

const handleNewItemSubmit = function () {
  $('.main-view').on("submit", "#js-new-bookmark-form", event => {

    event.preventDefault();

    const bookmark = $(event.target).serializeJson();

    api.createItem(bookmark)

      .then((bookmark) => {
        store.addItem(bookmark);
        store.adding = false;
        store.filter = 0;
        //addNewForm()
        render();
      })
      .catch((error) => {
        store.setError(error.message);
        renderError();
      });


  })

};

const getItemIdFromElement = function (item) {
  return $(item)
    .closest('.js-item-element')
    .data('item-id');
};

const handleDeleteItemClicked = function () {

  $(".main-view").on('click', '.js-item-delete', event => {
    // get the index of the item in store.items
    const id = getItemIdFromElement(event.currentTarget);
    // delete the item
    api.deleteItem(id)
      .then(() => {
        store.findAndDelete(id);

        // render the updated bookmark list
        render();
      })
      .catch((error) => {

        store.setError(error.message);
        renderError();
      })
  });
};

const handleEditbookmarkItemSubmit = function () {
  $('.main-view').on('submit', '#js-edit-item-form', event => {
    event.preventDefault();
    const id = getItemIdFromElement(event.currentTarget);
    const itemName = $(event.currentTarget).find('.bookmark-item').val();

    api.updateItem(id, { title: itemName })

      .then((newItem) => {
        store.findAndUpdate(id, { title: itemName });
        store.filter = 0;
        render();
      })
      .catch((error) => {
        console.log(error);
        store.setError(error.message);
        renderError();
      })
  })
};

const handleItemExpandClicked = function () {
  $('.main-view').on('click', '.bookmark-item__expanded', event => {

    const id = getItemIdFromElement(event.currentTarget);
    const item = store.findById(id);
    item.expanded = !item.expanded

    render();


  });
};
const handleOkClicked = function () {
  $('.main-view').on('click', '.js-item-toggle', event => {

    const id = getItemIdFromElement(event.currentTarget);
    const item = store.findById(id);
    item.expanded = !item.expanded

    render();


  });
};


const handleFilterClick = function () {

  let filterValue = $("#ratings option:selected").val();
  store.filter = filterValue;

  render()

}


const handleNewCancel = function () {
  $(".main-view").on("click", ".cancel", function () {
    event.preventDefault();

    store.adding = false

    render();
  })
}
const handleNewSubmit = function () {

  $(".main-view").on("click", ".initial-view-new", function () {
    event.preventDefault();
    console.log("clicked new");
    store.adding = true

    render()
  })
}
const addNewForm = function () {
  if (store.adding) {
    const newForm = ` 
  <div class="error-container"> </div>
  <form id="js-new-bookmark-form">
  
  <label for="bookmark-entry">Add New Bookmark:<br></label>  
  <input id= 'bookmark-entry' type="text" name="url" class="bookmark-url-entry" value="https://" placeholder="e.g., Nytimes.com" required><br>
  

  <label for="bookmark-title-entry">Bookmark Title:</label><br>
  <input id='bookmark-title-entry' type="text" name="title" class="bookmark-title-entry" placeholder="e.g., NYTimes" ><br>
  <label for="bookmark-rating-entry">Rating:</label><br>
  <div class="txt-center">
        <div class="rating">
        
            <input  id="bookmark-rating-entry" id="star5" name="rating" type="radio" value="5" class="radio-btn hide" />
            <label for="star5" >☆</label>
            <input  id="bookmark-rating-entry"id="star4" name="rating" type="radio" value="4" class="radio-btn hide" />
            <label for="star4" >☆</label>
            <input  id="bookmark-rating-entry"id="star3" name="rating" type="radio" value="3" class="radio-btn hide" />
            <label for="star3" >☆</label>
            <input  id="bookmark-rating-entry"id="star2" name="rating" type="radio" value="2" class="radio-btn hide" />
            <label for="star2" >☆</label>
            <input  id="bookmark-rating-entry"id="star1" name="rating" type="radio" value="1" class="radio-btn hide" />
            <label for="star1" >☆</label>
            <div class="clear"></div>
            
            <input id="star5" name="rating" type="radio" value="5" class="starRadio" />
           
            <input id="star4" name="rating" type="radio" value="4" class="starRadio" />
           
            <input id="star3" name="rating" type="radio" value="3" class="starRadio" />
            
            <input id="star2" name="rating" type="radio" value="2" class="starRadio" />
           
            <input id="star1" name="rating" type="radio" value="1" class="starRadio" />
            
           
        </div>
 
</div>
<label for='description'>A description of the website:<br></label>
<input id='description'type="text" name="desc" class="bookmark-description-entry" placeholder="description"><br>
  <button class="create" type="submit">create</button>
  <button class="cancel" type="reset">cancel</button>
</form>`



    $(".new-bookmark-form").html(newForm)

  } else {
    $(".new-bookmark-form").empty()
  }
}


const bindEventListeners = function () {
  handleNewItemSubmit();
  handleItemExpandClicked();
  handleDeleteItemClicked();
  handleEditbookmarkItemSubmit();
  handleCloseError();
  $(".main-view").on('change', '#ratings', handleFilterClick);
  handleNewSubmit();
  handleNewCancel();
  handleOkClicked();
};
// This object contains the only exposed methods from this module:
export default {
  render,
  bindEventListeners
};