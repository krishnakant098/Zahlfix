import test from 'node:test';
import assert from 'node:assert/strict';
import {STORY_SCENES,PLATES,beatOpacity,nextScene,serviceTarget} from '../../public/assets/v6/scene-registry.js';
import {composeEnquiry} from '../../public/assets/v6/contact.js';
test('twenty ordered, unique, readable story destinations',()=>{
  assert.equal(STORY_SCENES.length,20);assert.equal(new Set(STORY_SCENES.map(s=>s.id)).size,20);
  for(const [i,s] of STORY_SCENES.entries()){
    assert.equal(s.number,i+1);assert(s.enter<=s.live&&s.live<=s.target&&s.target<=s.hold&&s.hold<=s.out);
    assert.equal(beatOpacity(s.number,s.target),1,`${s.id}: destination must be readable`);
    if(i)assert(s.target>STORY_SCENES[i-1].target);
  }
  assert.equal(STORY_SCENES.at(-1).target,1);
});
test('services release before workflow becomes visible on all viewports',()=>{
  assert(PLATES.services.out<=PLATES.workflow.enter);
});
test('continue walks through every hold, including the last scene',()=>{
  for(let i=0;i<19;i++)assert.equal(nextScene(STORY_SCENES[i].target).id,STORY_SCENES[i+1].id);
  assert.equal(nextScene(1).id,'contact');
});
test('all ten service focus targets remain in the live plate',()=>{
  for(let i=0;i<10;i++)assert(serviceTarget(i)>=PLATES.services.live&&serviceTarget(i)<=PLATES.services.hold);
});
test('enquiry encoding preserves text and cannot inject mailto headers',()=>{
  const data=new URLSearchParams({name:'A & B',company:'ACME?bcc=other@example.com',email:'a@example.com',phone:'',challenge:'First line\nSecond line & question?'});
  const message=composeEnquiry(data);assert(message.url.startsWith('mailto:info@zahlfix.com?'));
  const url=new URL(message.url);assert.deepEqual([...url.searchParams.keys()],['subject','body']);
  assert.equal(url.searchParams.get('body'),message.body);assert(message.body.includes('Second line & question?'));
});
