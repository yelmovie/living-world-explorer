import Phaser from 'phaser';

/**
 * Phaser 3.90 leaves two listeners behind after game.destroy(): its canvas 'wheel' listener (the canvas goes back to
 * Phaser's pool and is reused, so the listener kept every old game and screen alive) and VisibilityHandler's document
 * 'visibilitychange'. Call this right after `new Phaser.Game` and use the returned function instead of game.destroy(true).
 */
export function releasable(game:Phaser.Game){
 let visibility:EventListenerOrEventListenerObject|undefined;
 // Game.texturesReady emits READY and then calls start(), which adds the visibility listener in the same task.
 game.events.once(Phaser.Core.Events.READY,()=>{
  const own=Object.prototype.hasOwnProperty.call(document,'addEventListener'),add=document.addEventListener;
  document.addEventListener=function(this:Document,type:string,listener:EventListenerOrEventListenerObject,options?:boolean|AddEventListenerOptions){if(type==='visibilitychange'&&!visibility)visibility=listener;return add.call(this,type,listener,options);} as typeof document.addEventListener;
  queueMicrotask(()=>{if(own)document.addEventListener=add;else delete (document as {addEventListener?:unknown}).addEventListener;});
 });
 return ()=>{const mouse=game.input.mouse;mouse?.target?.removeEventListener('wheel',mouse.onMouseWheel);if(visibility)document.removeEventListener('visibilitychange',visibility);game.destroy(true);};
}
