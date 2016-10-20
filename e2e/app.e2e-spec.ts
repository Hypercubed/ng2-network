import { Ng2NetworkPage } from './app.po';

describe('ng2-network App', function() {
  let page: Ng2NetworkPage;

  beforeEach(() => {
    page = new Ng2NetworkPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
