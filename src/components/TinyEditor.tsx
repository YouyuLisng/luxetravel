'use client';
import { Editor } from '@tinymce/tinymce-react';
import { useRef } from 'react';

interface TinyEditorProps {
    value: string;
    onChange: (val: string) => void;
}

export default function TinyEditor({ value, onChange }: TinyEditorProps) {
    const editorRef = useRef<any>(null);

    return (
        <Editor
            apiKey="cs3yculovnwpmfnl3bvoqn9bip21yjxr480f4phfj17g9rqe"
            value={value}
            onEditorChange={onChange}
            onInit={(_evt, editor) => {
                editorRef.current = editor;
            }}
            init={{
                language: 'zh_TW',
                image_advtab: false,
                plugins: [
                    'image',
                    'link',
                    'lists',
                    'media',
                    'table',
                    'code',
                    'wordcount',
                ],
                toolbar: 'undo redo | blocks | bold italic underline | customimage media link | align bullist numlist outdent indent | code',

                setup: (editor: { ui: { registry: { addButton: (arg0: string, arg1: { icon: string; tooltip: string; onAction: () => void; }) => void; }; }; insertContent: (arg0: string) => void; }) => {
                    editor.ui.registry.addButton('customimage', {
                        icon: 'image',
                        tooltip: '插入圖片',
                        onAction: () => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.onchange = async () => {
                                const file = input.files?.[0];
                                if (!file) return;

                                const formData = new FormData();
                                formData.append('file', file);

                                try {
                                    const res = await fetch(
                                        '/api/uploadthing/tinymce-upload',
                                        {
                                            method: 'POST',
                                            body: formData,
                                        }
                                    );

                                    const json = await res.json();
                                    if (
                                        !res.ok ||
                                        !json.ufsUrl ||
                                        typeof json.ufsUrl !== 'string'
                                    ) {
                                        alert(json.error || '圖片上傳失敗');
                                        return;
                                    }

                                    editor.insertContent(
                                        `<img src="${json.ufsUrl}" />`
                                    );
                                } catch (err) {
                                    console.error('圖片上傳發生錯誤', err);
                                    alert('圖片上傳錯誤');
                                }
                            };
                            input.click();
                        },
                    });
                },

                // ✅ 拖曳圖片 or 貼上圖片時的自動處理
                images_upload_handler: async (blobInfo: { blob: () => Blob; filename: () => string | undefined; }, success: (arg0: any) => void, failure: (arg0: string) => void) => {
                    try {
                        const formData = new FormData();
                        formData.append(
                            'file',
                            blobInfo.blob(),
                            blobInfo.filename()
                        );

                        const res = await fetch(
                            '/api/uploadthing/tinymce-upload',
                            {
                                method: 'POST',
                                body: formData,
                            }
                        );

                        const json = await res.json();
                        if (
                            !res.ok ||
                            !json.ufsUrl ||
                            typeof json.ufsUrl !== 'string'
                        ) {
                            failure(json.error || '圖片上傳失敗');
                            return;
                        }

                        success(json.ufsUrl);
                    } catch (err) {
                        console.error('圖片上傳錯誤', err);
                        failure('圖片上傳發生錯誤');
                    }
                },
            }}
        />
    );
}
