// Importing samples from the index.html file

const commentsContainer = document.querySelector(".comments > .container");
const commentSample = document.querySelector(".comment-sample > .sample");
const modalSample = document.querySelector(".modal-sample");
const addCommentSample = document.querySelector(".add-comment-sample > .add-comment");

// Initializing the commentsData and currentUserData variables

let commentsData;
let currentUserData;

// Checking whether the user has visited the page before

window.onload = () => {

  if (localStorage.commentsData) {

    // If visited, the user already has some data stored in the localStorage
    commentsData = JSON.parse(localStorage.commentsData);
    currentUserData = commentsData["currentUser"];
    triggerReset();
    addMainForm();

  } else {

    // If not, the data will be fetched from an exteranl file
    const request = new XMLHttpRequest();
    request.open("GET", "data.json");
    request.send();

    request.onload = () => {
      if (request.readyState == 4 && request.status == 200) {
        localStorage.commentsData = request.responseText;
        commentsData = JSON.parse(request.responseText);
        currentUserData = commentsData["currentUser"];
        triggerReset();
        addMainForm();
      }
    }
  }

}


// A function to make or update the new comment object

function setNewComment(commentForm, name) {

  let newComment = {
    id: +getMax(commentsData["comments"]) + 1,
    content: commentForm.children[0].value,
    createdAt: new Date(),
    score: 0,
    replyingTo: name ? name : null,
    user: {
      image: currentUserData["image"],
      username: currentUserData["username"]
    },
  }
  return newComment;

}


function editComment() {

  let editBtns = document.querySelectorAll(".comments button.edit");

  editBtns.forEach(element => {
    element.addEventListener("click", () => {

      // Getting the id of the comment
      let id = element.parentElement.parentElement.lastElementChild.dataset.id;

      // Getting the old comment element and its innerHTML
      let oldComment = element.parentElement.parentElement.querySelector(".main-text");
      oldComment.style.opacity = "0";
      let oldCommentText = oldComment.children[1].textContent;
      console.log(oldCommentText)

      // Making a clone of the addCommentSample and adjusting its content
      let updateForm = addCommentSample.querySelector("form").cloneNode(true);
      updateForm.querySelector("img").remove();
      updateForm.querySelector("textarea").innerHTML = oldCommentText.trim();
      updateForm.querySelector("input[type='submit']").value = "UPDATE";

      // Replacing the existing <p> by a <textarea>
      setTimeout(() => {
        element.parentElement.nextElementSibling.replaceChild(updateForm, oldComment);
      }, 500)


      updateForm.addEventListener("submit", (event) => {
        event.preventDefault();
        if (updateForm.children[0].value != "") {
          let updatedComment = updateForm[0].value;

          // Sending the updatedComment to the update function
          update(id, null, null, null, updatedComment);
        }
      })
    });
  });
}


function addReplyForm() {

  let replyBtns = document.querySelectorAll(".comments button.reply-btn");

  replyBtns.forEach(element => {
    element.addEventListener("click", () => {

      // Getting the id of the comment
      let id = element.parentElement.lastElementChild.dataset.id;

      // Getting the id of the name of person who commented
      let name = element.parentElement.querySelector(".name").innerHTML;

      // Getting the container of the form to display it
      let target = element.parentElement.parentElement.querySelector(".add-comment");
      target.style.maxHeight = "1000px";

      // Getting the form itself to dectect when it's submitted
      let replyForm = target.querySelector("form");

      // Setting the name of the person the user is going to reply to
      replyForm.querySelector("textarea").placeholder =
        `@${name} (will be added in your comment automatically)`;

      let newReply;
      replyForm.addEventListener("submit", (event) => {
        event.preventDefault();
        if (replyForm.children[0].value != "") {

          // Making a new reply object
          newReply = setNewComment(replyForm, name);

          // sending the new reply to the update function
          update(id, null, null, newReply, null);
        }
      });

      // Setting the form to close again if the user clicked anywhere outside it
      let children = Array.from(replyForm.children);
      document.addEventListener("click", (event) => {
        if (!event.target.isSameNode(replyForm) && !event.target.isSameNode(element) && !children.includes(event.target)) {
          target.style.maxHeight = "0";
        }
      });

    });
  });

}

// A function to update the votes of every comment and reply

function voting() {

  let votingBtns = document.querySelectorAll(".comments button.vote")

  votingBtns.forEach((element) => {

    element.addEventListener("click", (event) => {

      // Updating the comment votes but without letting the user have more than one vote
      let votingSpan;

      let id = element.parentElement.nextElementSibling.dataset.id;
      let count = element.dataset.count;
      if (element.classList.contains("upvote")) {
        // If it's the upvote button
        votingSpan = event.target.nextElementSibling;

        if (count != 1) {
          votingSpan.innerHTML = +votingSpan.innerHTML + 1;
          element.dataset.count = +element.dataset.count + 1;
          votingSpan.nextElementSibling.dataset.count = +votingSpan.nextElementSibling.dataset.count + 1
        } else {
          return;
        }

      } else if (event.target.classList.contains("downvote")) {
        // If it's the downvote button
        votingSpan = event.target.previousElementSibling;

        if (count != -1 && votingSpan.innerHTML != "0") {
          votingSpan.innerHTML = +votingSpan.innerHTML - 1;
          element.dataset.count = +element.dataset.count - 1;
          votingSpan.previousElementSibling.dataset.count = +votingSpan.previousElementSibling.dataset.count - 1
        } else {
          return;
        }
      }

      // Sending the new score to the update function
      update(id, "score", votingSpan.innerHTML, null, null, true);
    });

  });
}


function deleting() {

  let deleteBtns = document.querySelectorAll(".comments button.delete");

  deleteBtns.forEach((element) => {
    element.addEventListener("click", () => {

      // Getting the id of the comment
      let id = element.parentElement.parentElement.lastElementChild.dataset.id;

      // Creating a clone of the modalSample and appending it to the comments container
      let modalCloned = modalSample.cloneNode(true);
      commentsContainer.appendChild(modalCloned);

      // Making the modal appear
      modalCloned.style.pointerEvents = "auto";
      setTimeout(() => {
        modalCloned.style.opacity = "1";
      }, 100)

      // If the user clicked the cancel button, remove the modal form the page
      modalCloned.querySelector("button.cancel").addEventListener("click", () => {
        setTimeout(() => {
          modalCloned.style.opacity = "0";
        }, 100)
        setTimeout(() => {
          modalCloned.remove();
        }, 600)
      });

      // If the user clicked the confirm button, delete the comment
      modalCloned.querySelector("button.confirm").addEventListener("click", () => {
        remove(id);
      });
    });
  });
}

function remove(id) {

  // Getting the position of the comment/reply in the localStorage as an array 
  let position = findInStorage(id, commentsData["comments"]);
  let len = position.length;

  if (len == 1) {

    // If len == 1, then it's a comment and thus, it's located directly inside the commentsContainer => the array (position) is like this [0] or [3]
    commentsData["comments"].splice(position[0], 1);
  } else {

    // If len != 1, then it's a reply and thus it's a reply and thus, its position might be complicated => the array (position) is like this [1, 4] or [0, 3]
    // Strting form the dirct comment in the comments array, we will keep indexing inside the replies arrays untill we find the wanted reply
    let current = commentsData["comments"][position[0]];
    let counter = 0;
    while (current) {
      if (len - counter == 2) {

        // If len - counter == 2, then we are currently at the array the contains the reply we want and thus, we can splice it
        current["replies"].splice(position[counter + 1], 1);
        break;
      }

      // if len - counter != 2, then we haven't reached the array that contains the wanted reply and thus, we will keep indexing
      counter++;
      current = current["replies"][position[counter]];
    }
  }
  localStorage.commentsData = JSON.stringify(commentsData);
  triggerReset();

}

// The update function does many task but they are all related to updating the localStorage
// It updates the votes count, sets new comments/replies and updated existing comments/replies

function update(id, property, newContent, newComment, updatedComment, stopTrigger) {

  // Getting the position of the comment/reply
  let position = findInStorage(id, commentsData["comments"]);
  let len = position.length;

  // The function applies the same concept of the remove function concerning tracking the wanted comment/reply
  // but instead of targeting the array that contain it, we target the comment/reply itself => len - counter == 1
  let current = commentsData["comments"][position[0]];
  let counter = 0;
  while (current) {
    if (len - counter == 1) {

      // If we provide a new comment, then its task is to make a new comment/reply
      if (newComment) {
        if (!current["replies"]) {
          current.replies = [];
        }
        current["replies"].push(newComment);

        // If we provid an updated version of the comment, then its task is to update an existing function
      } else if (updatedComment) {
        current["content"] = updatedComment;

        // If we, instead, provide a property and a new content, then its task is to update the votes
      } else {
        current[property] = newContent;
      }
      break;
    }
    counter++
    current = current["replies"][position[counter]];
  }

  if (!stopTrigger) {
    triggerReset();
  }

  localStorage.commentsData = JSON.stringify(commentsData);
}

// A function to find the position of a comment/reply in the localStorage and return as an array
// [0, 2, 3] => the fourth reply inside the third reply inside the first comment in the localStorage

function findInStorage(id, commentsArr) {
  let found = false, arr = [];
  function recurse(id, commentsArr) {

    // Loop through the comments array
    for (let i of commentsArr) {

      // add the position of the comment to the array
      arr.push(commentsArr.indexOf(i));

      // If it's the wanted comment, set found to true and break
      if (i["id"] == id) {
        found = true;
        break;

        // If not, trigger the same function. But this time it will loop through the replies of these comments and so on and so forth untill we find it
      } else {
        if (i["replies"] && i["replies"].length != 0) {
          recurse(id, i["replies"]);
          if (found) {
            break;
          }
        }
      }

      // If not found at the end of the iteration remove the last item => this will empty (not just the last item) the whole array as it recurses
      arr.pop();
    }
  }

  recurse(id, commentsArr);
  return arr;
}

// A function to get the maximum id in the localStorage

function getMax(comments) {
  let max = 0;
  function recurse(comments) {
    for (let i of comments) {
      if (i["id"] > max) {
        max = i["id"];
      }

      if (i["replies"] && i["replies"].length != 0) {
        recurse(i["replies"]);
      }
    }
  }

  recurse(comments)
  return max;
}

// Adding the main form that the current user use to add a comment

function addMainForm() {

  addCommentSample.querySelector("img").src = currentUserData["image"]["png"];

  let mainComment = addCommentSample.cloneNode(true);

  let commentForm = mainComment.querySelector("form");

  commentForm.addEventListener("submit", (event) => {
    event.preventDefault();

    // Getting the new comment object
    let newComment = setNewComment(commentForm);

    // Inserting it directly into the comments container
    commentsData["comments"].push(newComment);

    // updating the localStorage
    localStorage.commentsData = JSON.stringify(commentsData);

    // Redistributing elements
    triggerReset();

  })
  document.body.appendChild(mainComment);

}

// A function to reset everything (redistribute elements in the page)

function reset(data, wrapper, commentSample) {

  let now = new Date();

  // Triggering the functions to select the new elements in the document
  showComments(data, wrapper, commentSample, now);
  deleting();
  voting();
  addReplyForm();
  editComment();
}

// A function to show the comments in the page

function showComments(data, wrapper, commentSample, now) {

  // Empting the wrapper (commentsContainer)
  wrapper.innerHTML = "";

  for (let i of data) {

    // Making a clone of the commentSample
    let comment = commentSample.cloneNode(true);

    // Adding the "current-user" class to the comment if it's the current user
    if (i["user"]["username"] == currentUserData["username"]) {
      comment.classList.add("current-user");
    }

    // Setting the reply form to have the photo of the current user
    comment.querySelector(".add-comment img").src = currentUserData["image"]["png"];

    // Getting the elements that we want to fill with data
    let commentInfo = comment.querySelector(".comment-text");
    let votes = comment.querySelector("span.votes");
    let idInput = comment.querySelector("input#id");

    for (let x in i) {

      // If x isn't "replies", we will just insert into the current comment
      if (x != "replies") {
        extractData(i, x, commentInfo, votes, idInput, now);
      }

      // If x is "replies", we will call the same function but this time to loop throught the replies array itself
      if (x == "replies" && i[x].length != 0) {
        showComments(i[x], comment.children[2], comment.cloneNode(true), now);
      }
    }

    wrapper.appendChild(comment);
  }

}


// A function to extract the information of the comment

function extractData(i, x, info, votes, idInput, newDate) {
  switch (x) {
    case "id": {
      idInput.dataset.id = i[x];
      break;
    };
    case "user": {
      info.querySelector("img").src = i[x]["image"]["png"];
      info.querySelector("span.name").innerHTML = i[x]["username"];
      break;
    };
    case "createdAt": {
      let difference = calcDifference(i[x], newDate);
      info.querySelector("span.time-passed").innerHTML = difference == "Just now" ? difference : "About " + difference + " ago";
      break;
    };
    case "replyingTo": {
      info.children[1].firstElementChild.innerHTML = "@" + i[x]
      break;
    }
    case "content": {
      info.children[1].lastElementChild.innerHTML = i[x];
      break;
    };
    case "score": {
      votes.innerHTML = i[x];
      break;
    }
  }
}

// A function to get the difference time since the user has commented

function calcDifference(oldDate, newDate) {

  let difference = newDate - (new Date(oldDate));
  let unit = difference / 1000;
  if (unit < 60) {
    return "Just now"
  } else {
    unit /= 60;
  }
  if (unit < 60) {
    return Math.round(unit) + " minutes";
  } else {
    unit /= 60;
  }
  if (unit < 24) {
    return Math.round(unit) + " hours";
  } else {
    unit /= 24;
  }
  if (unit >= 7 && unit < 30) {
    return Math.round((unit / 7)) + " weeks";
  } else if (unit < 7) {
    return Math.round(unit) + " days";
  } else if (unit > 30) {
    unit /= 30;
  }
  if (unit < 12) {
    return Math.round(unit) + " month"
  } else {
    return Math.round((unit / 12)) + " years"
  }

}


function triggerReset() {
  reset(commentsData["comments"], commentsContainer, commentSample);
}