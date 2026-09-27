import importlib.util
import unittest
from pathlib import Path

spec=importlib.util.spec_from_file_location('builder',Path(__file__).with_name('build-wechat-content.py'))
b=importlib.util.module_from_spec(spec);spec.loader.exec_module(b)


class FooterTests(unittest.TestCase):
    def test_plain_body_and_real_links(self):
        content=b.build_content('说明正文。\n自然收尾。\n#Agent #RAG')
        links=b.validate_content(content)
        self.assertEqual([x['label'] for x in links],['秀才的进阶之路','AI模拟面试官','DevSupport智能客服系统'])
        self.assertEqual(links[0]['href'],'https://mp.weixin.qq.com/s/FV93xYRR9R2BCWwKHC1A8A')
        self.assertIn('mp_article_text_link',links[0]['class'])
        self.assertTrue(content.startswith('说明正文。\n自然收尾。\n学习网站：'))
        self.assertNotIn('#Agent',content)

    def test_idempotent_html_footer(self):
        content=b.build_content('保留 A & B 的说明。')
        self.assertEqual(b.build_content(content,already_html=True),content)

    def test_platform_separation(self):
        raw='标题（3 选 1）：\n1. 面试官：RAG怎么优化\n\n小红书正文：\n小红书。\n\n抖音正文：\n抖音。\n\n小绿书正文：\n保留小绿书正文。\nAgent项目：\n[旧显示](旧链接)\n\n小红书/抖音候选标签：#RAG #Agent\n'
        title,content=b.read_copy_text(raw)
        self.assertEqual(title,'面试官：RAG怎么优化')
        self.assertNotIn('候选标签',content)
        self.assertNotIn('旧显示',content)
        self.assertEqual(len(b.validate_content(content)),3)

    def test_existing_learning_footer_is_replaced_not_duplicated(self):
        content=b.build_content('正文。\n学习网站：\n[旧名称](旧链接)\nAgent项目：\n旧项目')
        self.assertEqual(content,b.build_content('正文。'))
        self.assertEqual(content.count('学习网站：'),1)

    def test_missing_learning_link_rejected(self):
        good=b.build_content('正文。')
        with self.assertRaises(ValueError):
            b.validate_content('\n'.join(line for line in good.splitlines() if b.LEARNING_SITE[1] not in line))

    def test_wrong_learning_link_or_name_rejected(self):
        good=b.build_content('正文。')
        for bad in (good.replace(b.LEARNING_SITE[1],'https://golangstar.cn/'),good.replace(b.LEARNING_SITE[1],'https://example.com/'),good.replace(b.LEARNING_SITE[1],'https://mp.weixin.qq.com/s/dRcsdEvVdFTKSuNDYrvCzg'),good.replace('秀才的进阶之路','其他网站')):
            with self.subTest(content=bad),self.assertRaises(ValueError):
                b.validate_content(bad)

    def test_learning_entry_requires_native_article_markup(self):
        good=b.build_content('正文。')
        for bad in (good.replace('class="normal_text_link mp_article_text_link"','class="normal_text_link"',1),
                    good.replace(' data-itemshowtype="0"','',1),
                    good.replace('<a href="'+b.LEARNING_SITE[1]+'" class="normal_text_link mp_article_text_link" target="_blank" data-itemshowtype="0">秀才的进阶之路</a>', '秀才的进阶之路：'+b.LEARNING_SITE[1])):
            with self.subTest(content=bad), self.assertRaises(ValueError):
                b.validate_content(bad)

    def test_verified_platform_expansion_is_equivalent(self):
        from urllib.parse import urlencode
        good=b.build_content('正文。')
        expanded='https://mp.weixin.qq.com/s?'+urlencode(b.LEARNING_ARTICLE_ID)+'&scene=142#wechat_redirect'
        self.assertEqual(len(b.validate_content(good.replace(b.LEARNING_SITE[1],expanded),platform_readback=True)),3)
        for wrong in ('mid','idx','sn','__biz'):
            values=dict(b.LEARNING_ARTICLE_ID);values[wrong]='wrong'
            with self.subTest(field=wrong), self.assertRaises(ValueError):
                b.validate_content(good.replace(b.LEARNING_SITE[1],'https://mp.weixin.qq.com/s?'+urlencode(values)),platform_readback=True)

    def test_readback_does_not_apply_submission_byte_budget(self):
        good=b.build_content('正文。')
        long_body='内' * ((2048-len(good.encode()))//3)
        submitted=b.build_content(long_body+'正文。')
        from urllib.parse import urlencode
        expanded=submitted.replace(b.LEARNING_SITE[1],'https://mp.weixin.qq.com/s?'+urlencode(b.LEARNING_ARTICLE_ID)+'&scene=142#wechat_redirect')
        self.assertGreater(len(expanded.encode()),2048)
        self.assertEqual(len(b.validate_content(expanded,platform_readback=True)),3)
        with self.assertRaises(ValueError):
            b.validate_content(expanded)

    def test_footer_position_and_duplicates_rejected(self):
        good=b.build_content('正文。')
        for bad in (good+'\n后置正文。',good.replace('学习网站：','Agent项目：',1),good.replace('学习网站：','学习网站：\n学习网站：',1)):
            with self.subTest(content=bad),self.assertRaises(ValueError):
                b.validate_content(bad)

    def test_link_order_rejected(self):
        lines=b.build_content('正文。').splitlines()
        lines[2],lines[4]=lines[4],lines[2]
        with self.assertRaises(ValueError):
            b.validate_content('\n'.join(lines))

    def test_bad_links_rejected(self):
        good=b.build_content('正文。')
        for bad in (good.replace('idx=2','idx=1'),good.replace('DevSupport智能客服系统','错误项目'),good.replace('mp.weixin.qq.com','example.com'),good.replace('class="normal_text_link mp_article_text_link"',''),good+'\n#话题',good.replace('Agent项目：','Agent项目：'+('长'*1000))):
            with self.subTest(content=bad[:30]),self.assertRaises(ValueError):
                b.validate_content(bad)


class ReadbackTests(unittest.TestCase):
    def setUp(self):
        import copy
        from urllib.parse import urlencode
        spec=importlib.util.spec_from_file_location('readback',Path(__file__).with_name('validate-wechat-readback.py'))
        self.r=importlib.util.module_from_spec(spec);spec.loader.exec_module(self.r)
        content=b.build_content('正文。')
        self.request={'media_id':'fixture','index':0,'articles':{'article_type':'newspic','title':'测试','content':content,'image_info':{'image_list':[{'image_media_id':'original'}]}}}
        self.after={'news_item':[copy.deepcopy(self.request['articles'])]}
        self.after['news_item'][0]['content']=content.replace(b.LEARNING_SITE[1],'https://mp.weixin.qq.com/s?'+urlencode(b.LEARNING_ARTICLE_ID)+'&scene=142#wechat_redirect')

    def test_normalized_save_passes(self):
        result=self.r.validate(self.request,self.after)
        self.assertEqual(result['status'],'PASS')
        self.assertTrue(result['learning_short_link_expanded'])

    def test_changed_text_or_images_fail(self):
        import copy
        for kind in ('text','image','missing_link','wrong_article'):
            after=copy.deepcopy(self.after)
            item=after['news_item'][0]
            if kind=='text':item['content']=item['content'].replace('正文。','被覆盖的正文。')
            elif kind=='image':item['image_info']['image_list'][0]['image_media_id']='changed'
            elif kind=='missing_link':item['content']=item['content'].replace('mp_article_text_link','',1)
            else:item['content']=item['content'].replace('2247494997','2247494998')
            with self.subTest(kind=kind),self.assertRaises(ValueError):
                self.r.validate(self.request,after)

    def test_unrequested_author_change_fails(self):
        import copy
        before=copy.deepcopy(self.after);before['news_item'][0]['author']='原作者'
        self.after['news_item'][0]['author']='另一个作者'
        with self.assertRaises(ValueError):self.r.validate(self.request,self.after,before)


if __name__=='__main__':unittest.main()
