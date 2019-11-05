const monday = require('./monday');

const express = require('express');
const app = express();
const port = process.env.PORT || 2800;
console.log('PORT', process.env.PORT);

const _ = require('lodash');
var bodyParser   = require('body-parser');


const COM_INIT_BOARD_NAME = 'Company Initiatives';
const CONNECTEDID = 'text7';
const STATUS = 'status3';
const CREATOR = 'text';

const eventStack = [];

let mainColumns = [];
const allowedColumns = [{
  nameS: 'people',  // from source
  nameT: 'people',  // to target
  key: (column)=>{
    try {
      return {
        personsAndTeams: JSON.parse(column.value).personsAndTeams
      };
    } catch(err) {
      return null;
    }
  }

}, {
  nameS: 'status',  // from source
  nameT: 'status',  // to target
  key: (column)=>{
    try {
      return {
        index: JSON.parse(column.value).index
      };
    } catch(err) {
      return null;
    }
  }
}, {
  nameS: 'timeline',  // from source
  nameT: 'timeline',  // to target
  key: (column)=>{
    try {
      return {
        from: JSON.parse(column.value).from,
        to: JSON.parse(column.value).to
      };
    } catch(err) {
      return null;
    }
  }
},  {
  nameS: 'dependency',  // from source
  nameT: 'dependency',  // to target
  key: (column)=>null
}, {
  nameS: 'tags',  // from source
  nameT: 'tags',  // to target
  key: (column)=>{
    try {
      return {
        tag_ids: JSON.parse(column.value).tag_ids
      };
    } catch(err) {
      return null;
    }
  }
}, {
  nameS: 'text tags',  // from source
  nameT: 'tags',  // to target
  key: (column)=>{
    try {
      return column.text;
    } catch(err) {
      return null;
    }
  }
}, {
  nameS: 'text status',  // from source
  nameT: 'status',  // to target
  key: (column)=>{
    try {
      return column.label;
    } catch(err) {
      return null;
    }
  }
}];

let mainBoardId = '';
let mainGroups = [];
let allTags = [];



app.use(bodyParser.json({ limit: '5mb' }));
app.get('/', (req, res) => res.send('Status OK'))

app.use('/monday-callback', async (req, res) => {
  
  if (req.body.challenge) {
    res.send(req.body);
    return
  }
  // if (process.env.ENV == 'init') {
  //   res.send(req.body);
  //   return ;
  // }

  
  // console.log('Event accepted -', req.body);

  if (req.body.event) {
    const event = req.body.event;

    if (event.type === 'create_pulse') {
      console.log('update_column_value - event type accepted');
      eventStack.push({
        event: event
      })
    } else if (event.type === 'update_column_value') {
      console.log('update_column_value - event type accepted');
      eventStack.push({
        event: event
      })
    } else if (event.type === 'create_update') {
      console.log('create_update - event type accepted');
      eventStack.push({
        event: event
      })
    }
  }

  res.status(200).json({ success: 1 });
});


app.listen(port, () => console.log(`Example app listening on port ${port}!`));

// status people tags timeline created_by and created_at

async function handlePulse (id) {
  const item = await monday.getItemsById(id);
  
  // get item's tag
  const tagsV = item.column_values.filter( value => value.title && value.title.toLowerCase().indexOf('tag') != -1);

  if (tagsV.length == 0 || !tagsV[0].value) {
    return ;
  }
  console.log('------- Item ------- ', item.name);


  let tags = [];
  try {
    // tags = JSON.parse(tagsV[0].text).tag_ids;
    tags = tagsV[0].text.split(',').map(t => t.trim());
  } catch(err) {
    console.log('Tags not foud');
    return 
  }

  console.log('Item\'s tag found  - ', tags);
  await getMainGroups();

  const mainGroupTags = mainGroups.map(g => g.tag);
  for(let tagI = 0; tagI < tags.length; tagI ++) {
    let index = mainGroupTags.indexOf(tags[tagI]);
    if (index != -1) {
      await sycnItemInGroup(mainGroups[index], item);
    }
  }
}

function calcColumnValue(columnValues) {
  
  
  let resColumnValues = {};
  console.log('calcColumnValue: ', JSON.stringify(columnValues));
  allowedColumns.map(column => {
    let mainColumn = _.find(mainColumns, (item) => item.title.toLowerCase() == column.nameS);
    let columnValue = _.find(columnValues, (item) => item.title.toLowerCase() == column.nameT);
    if (!mainColumn || !columnValue) {
      return ;
    }


    let actualValue = column.key(columnValue);
    if (actualValue) {
      resColumnValues[mainColumn.id] = actualValue;
    }
  });
  
  console.log(resColumnValues);
  return resColumnValues;
}

async function sycnItemInGroup(group, item) {
  console.log('----------------sycnItemInGroup--------------');
  console.log(`sycnItemInGroup: Groupid = ${group.group.id}, itemId=${item.id}, itemName=${item.name}`);
  
  // Find all items in init board with the connect id.
  const groupItems = await monday.getItemsByColumnValues(CONNECTEDID, item.id, mainBoardId);

  // Find items only in the group
  const filteredItem = groupItems.filter(item => item.group.id === group.group.id);

  let columnValues = calcColumnValue(item.column_values);

  if (filteredItem.length > 0) {
    columnValues[CONNECTEDID] = item.id + '';
    columnValues[CREATOR] = item.creator.name + ' ' + item.created_at;
    
    columnValues['name'] = item.name;
    
    // console.log(columnValues, mainColumns);
    // debugger
    console.log('Updating', filteredItem[0].id, columnValues);
    const res = await monday.updateItem(+filteredItem[0].id, +mainBoardId, columnValues);
    console.log('*************Finished Update: ', res);
  } else {
    columnValues[CONNECTEDID] = item.id + '';
    // console.log(columnValues, mainColumns);
    columnValues[CREATOR] = item.creator.name + ' ' + item.created_at;
    // debugger
    console.log('Creating', item.name, columnValues);
    const res = await monday.createItem(+mainBoardId, group.group.id, item.name, columnValues)
    console.log('*************Finished Creation: ', res);
  }

  let groupItemsForStatus = await monday.getAllItemsByGroup(+mainBoardId, group.group.id, STATUS);
  
  let completedItems = groupItemsForStatus.filter(item => {
    try {
      return JSON.parse(item.column_values[0].value).index === 4;
    } catch(err) {
      return false
    }
  });

  const newGroupName = group.group.title.split('@')[0] + `(${completedItems.length}/${groupItemsForStatus.length})`;

}

async function getInitiativesBoardId() {
  const boards = await monday.getAllBoards();

  let index = -1;
  for (let i = 0; i < boards.length; i++) {
    if (boards[i].name.indexOf(COM_INIT_BOARD_NAME) !== -1) {
      index = i;
      break;
    }
  }

  return index == -1 ? '' : boards[index].id;
}

const wait = (timeout) => new Promise((resolve, reject) => setTimeout(()=>resolve(), timeout));


async function getMainGroups() {
  let data = await monday.getGroupsByBoard(mainBoardId);
  let inGroups = data.groups;


  const groupsWithTags = [];
  // debugger
  for (let i = 0; i < inGroups.length; i ++){
    let hashMatch = inGroups[i].title.match(/\(\#([^\)]*)\)/);

    if (hashMatch) {
      // let tagIndex = allTags.find(tag => tag.name.toLowerCase().indexOf(hashMatch[1].toLowerCase()) != -1);
      
      // console.log(tagIndex)

      if (hashMatch) {
        groupsWithTags.push({
          group: inGroups[i],
          tag: hashMatch[1]
        });
      }
    }
  }
  mainGroups = groupsWithTags;
  mainColumns = data.columns;
}

// (async function () {
//   for (let i = 0; i < 10; i++ ){
//     setTimeout(() => {
//       eventStack.push({
//         pulseId: 362234016
//       })
//     }, 2000)
//   }
// })();

async function start () {
  // console.log('start', eventStack);
  if (eventStack.length == 0) {
    setTimeout(() => { 
      start();
    }, 1000 * 5);
  } else {
    let event = eventStack.shift();  
    console.log('Running', event.event.pulseId, event.event.type);
    if (event.event.pulseId) {
      handlePulse(event.event.pulseId)
      .then(() => {

        setTimeout(() => { 
          console.log('--------- WAITING----------');
          start();
        }, 1000 * 5);
        
      });
    }
  }
}
(async function () {
  mainBoardId = 353087523;

  mainBoardId = await getInitiativesBoardId();
  console.log('MAIN BOARD ID SELECTED - ', mainBoardId);


  // allTags = await monday.getAllTags();
  // console.log(JSON.stringify(allTags));


  await getMainGroups();
  console.log('MAIN GROIPS SELECTED - ', mainGroups);


  start()
    

  // new_group, 353087523
  // await handlePulse(362234016);
})();
