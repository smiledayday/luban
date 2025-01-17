import {
  MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { loadMicroApp, MicroApp } from 'qiankun';
import { Button, Input, notification } from 'antd';
import shallow from 'zustand/shallow';
import { getRandomString } from '@/backend/service/compileService/generateReactSourceCode/utils';
import { PageModel } from '@/backend/types';
import { HighLightCodeEditor } from '@/frontend/components';
import { toCComponents } from './config';
import {
  ConfigPanel,
  ComponentsSelectArea,
  ComponentItem,
  TemplateConfig,
  TemplateList,
} from './components';
import useStore from '@/frontend/store';
import { useCreateTemplateApi } from './api';
import { SaveTemplateRequestDTO } from '@/backend/service/templateService/types';

const ToCEditor = () => {
  const { pageModel, currentComponent } = useStore(
    (state) => ({
      pageModel: state.editor.pageModel,
      currentComponent: state.editor.currentChooseComponent,
    }),
    shallow,
  );
  const [key, setKey] = useState('test1');
  const [content, setContent] = useState(JSON.stringify(pageModel));
  const [sourceCode, setSourceCode] = useState('');
  const [templateConfigShow, setTemplateConfigShow] = useState(false);
  const microAppRef: MutableRefObject<MicroApp | null> = useRef(null);

  const { createTemplate } = useCreateTemplateApi();

  useEffect(() => {
    setContent(JSON.stringify(pageModel));
  }, [pageModel]);

  useEffect(() => {
    setContent(
      JSON.stringify({ ...pageModel, meta: { ...pageModel.meta, key } }),
    );
  }, [key]);

  const previewPage = useCallback(async () => {
    const suffix = getRandomString();
    const randomKey = `${key}${suffix}`;
    const tempPageModel: PageModel = {
      ...pageModel,
      meta: { ...pageModel.meta },
    };
    tempPageModel.meta.key = randomKey;
    const data: any = await fetch('/api/generatePage/', {
      method: 'post',
      body: JSON.stringify(tempPageModel),
    }).then((response) => response.json());
    if (data && data.data) {
      const htmlPath = data.data.htmlPath;
      if (htmlPath) {
        if (microAppRef.current) {
          microAppRef.current.unmount();
        }
        microAppRef.current = loadMicroApp({
          name: `luban-app-${randomKey}`,
          entry: `${htmlPath}`,
          container: '#lubanAppContainer',
        });
      }
    }
  }, [pageModel]);

  useEffect(() => {
    previewPage();
  }, [pageModel]);

  const runPage = useCallback(async () => {
    const suffix = getRandomString();
    const randomKey = `${key}${suffix}`;
    const tempPageModel: PageModel = {
      ...pageModel,
      meta: { ...pageModel.meta },
    };
    tempPageModel.meta.key = randomKey;
    tempPageModel.meta.mode = 'production';
    const data: any = await fetch('/api/generatePage/', {
      method: 'post',
      body: JSON.stringify(tempPageModel),
    }).then((response) => response.json());
    if (data && data.data) {
      const htmlPath = data.data.htmlPath;
      if (htmlPath) {
        if (microAppRef.current) {
          microAppRef.current.unmount();
        }
        microAppRef.current = loadMicroApp({
          name: `luban-app-${randomKey}`,
          entry: `${htmlPath}`,
          container: '#lubanAppContainer',
        });
      }
    }
  }, [pageModel]);

  const deploy = useCallback(async () => {
    const tempPageModel: PageModel = {
      ...pageModel,
      meta: { ...pageModel.meta },
    };
    tempPageModel.meta.mode = 'deploy';
    const data: any = await fetch('/api/generatePage/', {
      method: 'post',
      body: JSON.stringify(tempPageModel),
    });
    console.log(data);
  }, [pageModel]);

  const getReactCode = async () => {
    const code = await fetch('/api/compileToSourceCode/', {
      method: 'post',
      body: content,
    })
      .then((response) => response.json())
      .then((json) => json.data);
    setSourceCode(code);
  };

  const openTemplateConfigModal = useCallback(() => {
    setTemplateConfigShow(true);
  }, []);

  const closeTemplateConfigModal = useCallback(() => {
    setTemplateConfigShow(false);
  }, []);

  const createTemplateAndCloseModal = useCallback(
    async (templateData: SaveTemplateRequestDTO) => {
      const result = await createTemplate(templateData);
      if (result) {
        closeTemplateConfigModal();
      } else {
        notification.error({
          message: '创建模板失败',
        });
      }
    },
    [],
  );

  return (
    <div style={{ display: 'flex', width: '100vw' }}>
      <div style={{ flex: '0 0 300px' }}>
        <Input value={key} onChange={(e) => setKey(e.target.value)} />
        <Input.TextArea
          style={{ width: '500px', height: '200px' }}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <h3>场景组件</h3>
        <ComponentsSelectArea>
          {/* toC */}
          {toCComponents.map((component) => (
            <ComponentItem data={component} key={component.name} />
          ))}
        </ComponentsSelectArea>
        <div style={{ marginTop: '20px' }}>
          <Button
            style={{ marginLeft: '20px' }}
            onClick={openTemplateConfigModal}>
            保存为模板
          </Button>
          <Button style={{ marginLeft: '20px' }} onClick={runPage}>
            运行真实页面
          </Button>
          <Button style={{ marginLeft: '20px' }} onClick={deploy}>
            发布
          </Button>
        </div>
        <h3>模板</h3>
        <TemplateList />
        <div style={{ marginTop: '20px' }}>
          <Button onClick={getReactCode}>预览代码</Button>
        </div>
        <div>
          <HighLightCodeEditor
            language="jsx"
            code={sourceCode}
            onChange={setSourceCode}
            style={{ width: '550px' }}
            wrapperStyle={{
              width: '550px',
              height: '300px',
            }}
          />
          {/* <Input.TextArea
          style={{ width: '300px', height: '300px' }}
          value={sourceCode}
          onChange={(e) => setSourceCode(e.target.value)}
        /> */}
        </div>
      </div>
      <div
        id="lubanAppContainer"
        style={{
          position: 'relative',
          width: '375px',
          border: '1px solid #eee',
        }}
        key="container"
      />
      <div>
        <ConfigPanel data={currentComponent} />
      </div>
      <TemplateConfig
        open={templateConfigShow}
        onOk={createTemplateAndCloseModal}
        onCancel={closeTemplateConfigModal}
        type="create"
      />
    </div>
  );
};

export default ToCEditor;
