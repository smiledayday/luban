import { CSSProperties, FC, useMemo } from 'react';
import Editor from 'react-simple-code-editor';
import Highlight, { defaultProps, Language } from 'prism-react-renderer';
import theme from 'prism-react-renderer/themes/nightOwl';

interface HighLightCodeEditorProps {
  code: string;
  onChange: (code: string) => void;
  language: Language;
  wrapperStyle?: CSSProperties;
  style?: CSSProperties;
}

export const HighLightCodeEditor: FC<HighLightCodeEditorProps> = ({
  code,
  onChange,
  language,
  wrapperStyle,
  style,
}) => {
  const styles = useMemo(
    () => ({
      root: {
        boxSizing: 'border-box',
        fontFamily: '"Dank Mono", "Fira Code", monospace',
        overflow: 'auto',
        ...(style || {}),
        ...theme.plain,
      } as CSSProperties,
    }),
    [style],
  );

  const wrapperStyles = useMemo(
    () => ({
      overflow: 'auto',
      ...(wrapperStyle || {}),
    }),
    [wrapperStyle],
  );

  const onValueChange = (newCode: string) => {
    if (typeof onChange === 'function') {
      onChange(newCode);
    }
  };

  const highlight = (highlightCode: string) => (
    <Highlight
      {...defaultProps}
      theme={theme}
      code={highlightCode}
      language={language}>
      {({ tokens, getLineProps, getTokenProps }) => (
        <>
          {tokens.map((line, i) => (
            <div {...getLineProps({ line, key: i })}>
              {line.map((token, key) => (
                <span {...getTokenProps({ token, key })} />
              ))}
            </div>
          ))}
        </>
      )}
    </Highlight>
  );

  return (
    <div style={wrapperStyles}>
      <Editor
        value={code}
        onValueChange={onValueChange}
        highlight={highlight}
        padding={10}
        style={styles.root}
      />
    </div>
  );
};
