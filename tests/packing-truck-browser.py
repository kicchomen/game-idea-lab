import json,time
from playwright.sync_api import sync_playwright
routes=json.load(open('assets/packing-truck/qa-routes.json'))
results=[]
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 context=b.new_context(viewport={'width':1100,'height':1100})
 page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 for width in [1100,320,360,390]:
  page.set_viewport_size({'width':width,'height':1100});page.goto('http://127.0.0.1:8767/games/packing-truck/')
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  page.locator('#start').click()
  for job,route in enumerate(routes):
   for item in route:
    page.locator('#pieces button').nth(item['id']).click()
    if item['rot']:page.locator('#rotate').click()
    cell=page.locator(f'.cell[data-x="{item["x"]}"][data-y="{item["y"]}"]')
    cell.focus();page.keyboard.press('Enter')
    if item!=route[-1]:assert page.evaluate('document.activeElement.classList.contains("cell")')
   assert '積み込み成功' in page.locator('#status').inner_text()
   if job<2:page.locator('#start').click()
  page.screenshot(path=f'assets/packing-truck/success-{width}.png',full_page=True)
  page.locator('#start').click();assert '1 / 3' in page.locator('#job').inner_text()
  page.locator('#pause').click();t=page.locator('#time').inner_text();page.wait_for_timeout(1100);assert page.locator('#time').inner_text()==t
  page.locator('#pause').click();page.locator('#retry').click();assert page.locator('#start').inner_text()=='積み込み開始'
  page.locator('#start').click();page.locator('.cell').nth(0).click();page.locator('#pieces button').nth(0).click();page.locator('#remove').click();assert page.locator('.loaded').count()==0
  page.screenshot(path=f'assets/packing-truck/layout-{width}.png',full_page=True)
  results.append({'width':width,'three_jobs_success':True,'keyboard_focus':True,'pause_retry_remove':True,'overflow':False})
 page.set_viewport_size({'width':1100,'height':1100});page.goto('http://127.0.0.1:8767/games/packing-truck/');page.locator('#start').click()
 page.locator('.cell').nth(0).click();page.locator('#pieces button').nth(2).click();page.screenshot(path='assets/packing-truck/gameplay.png',full_page=True)
 # Natural 90-second failure, no state injection or time mock.
 page.locator('#retry').click();page.locator('#start').click();page.wait_for_function("document.querySelector('#status').textContent.startsWith('時間切れ')",timeout=100000)
 page.screenshot(path='assets/packing-truck/failure.png',full_page=True);page.locator('#retry').click();page.locator('#start').click();assert 'すべての荷物を荷台へ' in page.locator('#status').inner_text()
 assert not errors,errors
 json.dump({'browser':'isolated system Chromium headless','results':results,'natural_90_second_failure':True,'errors':errors,'physical_phone':False,'novice_human':False},open('assets/packing-truck/browser-results.json','w'),ensure_ascii=False,indent=2)
 b.close()
print('Passed actual browser width/success/failure/retry/keyboard checks')
