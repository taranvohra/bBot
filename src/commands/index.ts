import generalCommands from './general';
import pugsCommands from './pugs';
import queryCommands from './queries';

const commandList = [...generalCommands, ...pugsCommands, ...queryCommands];

export default commandList;
