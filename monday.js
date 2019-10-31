const axios = require('axios');

// const API_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjI1MDc0NTI3LCJ1aWQiOjEwODExODIwLCJpYWQiOiIyMDE5LTEwLTIyIDE1OjEwOjM3IFVUQyIsInBlciI6Im1lOndyaXRlIn0.ekHaxwvtTe0d8vwtPVWiRQXX7RnhwUNXESY_YHrxJA4';
const API_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjI1NTAwNzY4LCJ1aWQiOjEwODExODIwLCJpYWQiOiIyMDE5LTEwLTI4IDE3OjA4OjE5IFVUQyIsInBlciI6Im1lOndyaXRlIn0.JEVEU4YYC1mqYfuBk_P6Hw1zG3FHPXxk_fh-Ckkr3hg';

const axiosQuery = function(body) {
  return axios.post(`https://api.monday.com/v2`, body, {
    headers: {
      Authorization: API_TOKEN
    }
  }).then(res => {
    if (res.errors) {
      throw new Error(res.errors);
    } else return res;

  });
}

module.exports.getAllBoards = function () {
  return axiosQuery({
    query: `
    query {
      boards (limit: 100) {
        description,
        name,
        id
      }
    }
  `,
  }).then(res => {
    return res.data.data.boards;
  }).catch(err => {
    console.log(err);
    return [];
  })
}


module.exports.getGroupsByBoard = function (boardId) {
  return axiosQuery({
    query: `
    query {
      boards (ids: ${boardId}, limit: 100) {
        description,
        name,
        id,

        groups {
          id,
          title
        },
        columns {
          id,
          title
        }
      }
    }
  `,
  }).then(res => {
    return {
      groups: res.data.data.boards[0].groups,
      columns: res.data.data.boards[0].columns
    };
  }).catch(err => {
    console.log(err);
    return [];
  })
}


module.exports.getAllTags = function () {
  return axiosQuery({
    query: `
    query {
      tags {
        id,
        name,
        color
      }
    }
  `,
  }).then(res => {
    return res.data.data.tags;
  }).catch(err => {
    console.log(err);
    return [];
  })
}

module.exports.getItemsById = function (id) {
  return axiosQuery({
    query: `
    query {
      items (ids: ${id}) {
        id,
        name,
        column_values {
          id,
          value,
          text,
          title
        },
        group {
          id
        },
        state,
        created_at,
        updated_at,
        creator {
          name
        }
      }
    }
  `,
  }).then(res => {
    return res.data.data.items[0];
  }).catch(err => {
    console.log(err);
    return [];
  })
}

module.exports.getItemsByColumnValues = function (columnId, columnValue, boardId) {
  return axiosQuery({
    query: `
    query {
      items_by_column_values (column_id: "${columnId}", column_value: "${columnValue}", board_id: ${boardId}) {
        id,
        name,
        column_values  {
          id,
          text,
          value,
          title
        },
        group {
          id
        }
      }
    }
  `,
  }).then(res => {
    return res.data.data.items_by_column_values;
  }).catch(err => {
    console.log(err);
    return [];
  })
}

module.exports.getAllItemsByTag = function () {
  return axiosQuery({
    query: `
    query {
      items {
        id,
        name,
        tags {}
      }
    }
  `,
  }).then(res => {
    return res.data.data.tags;
  }).catch(err => {
    console.log(err);
    return [];
  })
}


module.exports.createItem = function (boardId, groupId, itemName, customFields) {
  return axiosQuery({
    query: `
    mutation ($boardId: Int!, $groupId: String!, $itemName: String!, $columnValues: JSON!) {
      create_item (
      board_id: $boardId,
      group_id: $groupId,
      item_name: $itemName,
      column_values: $columnValues
      ) {
        id
      }
    }
    `,
    variables: {
      boardId: boardId,
      groupId: groupId,
      itemName: itemName,
      columnValues: JSON.stringify(customFields)
    },
  }).then(res => {
    return res.data.data;
  }).catch(err => {
    console.log(err);
    return [];
  })
}

module.exports.createItem = function (boardId, groupId, itemName, customFields) {
  return axiosQuery({
    query: `
    mutation ($boardId: Int!, $groupId: String!, $itemName: String!, $columnValues: JSON!) {
      create_item (
      board_id: $boardId,
      group_id: $groupId,
      item_name: $itemName,
      column_values: $columnValues
      ) {
        id
      }
    }
    `,
    variables: {
      boardId: boardId,
      groupId: groupId,
      itemName: itemName,
      columnValues: JSON.stringify(customFields)
    },
  }).then(res => {
    return res.data.data;
  }).catch(err => {
    console.log(err);
    return [];
  })
}

module.exports.updateItem = function (itemId, boardId, customFields) {
  return axiosQuery({
    query: `
    mutation ($itemId: Int!, $boardId: Int!, $columnValues: JSON!) {
      change_multiple_column_values (
      item_id: $itemId,
      board_id: $boardId,
      column_values: $columnValues
      ) {
        id
      }
    }
    `,
    variables: {
      itemId: itemId,
      boardId: boardId,
      columnValues: JSON.stringify(customFields)
    },
  }).then(res => {
    return res.data.data;
  }).catch(err => {
    console.log(err);
    return [];
  })
}



module.exports.getMainCustomFields = function (boardId) {
  return axiosQuery({
    query: `
    query {
      boards (ids: ${boardId}, limit: 100) {
        description,
        name,
        id,

        groups {
          id,
          title
        }
      }
    }
  `,
  }).then(res => {
    return res.data.data.boards[0].groups;
  }).catch(err => {
    console.log(err);
    return [];
  })
}
