import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Select, Switch, TimePicker, message, Space } from 'antd';
import { SaveOutlined, PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { Job } from '../types/job';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

interface JobConfig {
  schedule: {
    frequency: string;
    time: string;
    daysOfWeek?: string[];
    dayOfMonth?: number;
  };
  emailSettings: {
    recipients: string[];
    subject: string;
    body: string;
  };
  folderPaths: {
    source: string;
    destination: string;
    archive?: string;
  };
  filePatterns: string[];
  options: {
    deleteAfterProcessing: boolean;
    createArchive: boolean;
    validateContent: boolean;
    retryCount: number;
  };
}

interface Props {
  job: Job;
  onSave: (jobId: number, config: JobConfig) => Promise<void>;
}

const JobConfigEditor: React.FC<Props> = ({ job, onSave }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchJobConfig();
  }, [job.id]);

  const fetchJobConfig = async () => {
    try {
      const response = await fetch(`/api/v1/jobs/${job.id}/config`);
      if (response.ok) {
        const config = await response.json();
        // Convert time string to dayjs for TimePicker
        if (config.schedule?.time) {
          config.schedule.time = dayjs(config.schedule.time, 'HH:mm');
        }
        form.setFieldsValue(config);
      }
    } catch (error) {
      message.error('Failed to fetch job configuration');
    }
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      // Convert dayjs time to string
      if (values.schedule?.time) {
        values.schedule.time = values.schedule.time.format('HH:mm');
      }
      await onSave(job.id, values);
      message.success('Job configuration saved successfully');
    } catch (error) {
      message.error('Failed to save job configuration');
    }
    setLoading(false);
  };

  return (
    <Card title={`Job Configuration: ${job.job_name}`} className="mb-6">
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          schedule: {
            frequency: 'daily',
            daysOfWeek: ['MON'],
          },
          options: {
            deleteAfterProcessing: false,
            createArchive: true,
            validateContent: true,
            retryCount: 3,
          },
          filePatterns: [''],
        }}
      >
        {/* Schedule Settings */}
        <Card title="Schedule Settings" size="small" className="mb-4">
          <Form.Item
            name={['schedule', 'frequency']}
            label="Frequency"
            rules={[{ required: true }]}
          >
            <Select>
              <Option value="daily">Daily</Option>
              <Option value="weekly">Weekly</Option>
              <Option value="monthly">Monthly</Option>
            </Select>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prev, curr) => 
              prev?.schedule?.frequency !== curr?.schedule?.frequency
            }
          >
            {({ getFieldValue }) => {
              const frequency = getFieldValue(['schedule', 'frequency']);
              return frequency === 'weekly' ? (
                <Form.Item
                  name={['schedule', 'daysOfWeek']}
                  label="Days of Week"
                  rules={[{ required: true }]}
                >
                  <Select mode="multiple">
                    <Option value="MON">Monday</Option>
                    <Option value="TUE">Tuesday</Option>
                    <Option value="WED">Wednesday</Option>
                    <Option value="THU">Thursday</Option>
                    <Option value="FRI">Friday</Option>
                    <Option value="SAT">Saturday</Option>
                    <Option value="SUN">Sunday</Option>
                  </Select>
                </Form.Item>
              ) : frequency === 'monthly' ? (
                <Form.Item
                  name={['schedule', 'dayOfMonth']}
                  label="Day of Month"
                  rules={[{ required: true }]}
                >
                  <Select>
                    {Array.from({ length: 31 }, (_, i) => (
                      <Option key={i + 1} value={i + 1}>
                        {i + 1}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              ) : null;
            }}
          </Form.Item>

          <Form.Item
            name={['schedule', 'time']}
            label="Time"
            rules={[{ required: true }]}
          >
            <TimePicker format="HH:mm" className="w-full" />
          </Form.Item>
        </Card>

        {/* Email Settings */}
        <Card title="Email Settings" size="small" className="mb-4">
          <Form.List name={['emailSettings', 'recipients']}>
            {(fields, { add, remove }) => (
              <>
                {fields.map((field, index) => (
                  <Form.Item required={false} key={field.key}>
                    <Form.Item
                      {...field}
                      validateTrigger={['onChange', 'onBlur']}
                      rules={[
                        {
                          required: true,
                          whitespace: true,
                          message: "Please input recipient's email or delete this field.",
                        },
                        {
                          type: 'email',
                          message: 'Please enter a valid email',
                        },
                      ]}
                      noStyle
                    >
                      <Input
                        placeholder="Email address"
                        style={{ width: '90%' }}
                      />
                    </Form.Item>
                    {fields.length > 1 && (
                      <MinusCircleOutlined
                        className="ml-2"
                        onClick={() => remove(field.name)}
                      />
                    )}
                  </Form.Item>
                ))}
                <Form.Item>
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    icon={<PlusOutlined />}
                    className="w-full"
                  >
                    Add Recipient
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <Form.Item
            name={['emailSettings', 'subject']}
            label="Email Subject"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name={['emailSettings', 'body']}
            label="Email Body"
            rules={[{ required: true }]}
          >
            <TextArea rows={4} />
          </Form.Item>
        </Card>

        {/* Folder Settings */}
        <Card title="Folder Settings" size="small" className="mb-4">
          <Form.Item
            name={['folderPaths', 'source']}
            label="Source Folder"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name={['folderPaths', 'destination']}
            label="Destination Folder"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name={['folderPaths', 'archive']}
            label="Archive Folder"
          >
            <Input />
          </Form.Item>
        </Card>

        {/* File Patterns */}
        <Card title="File Patterns" size="small" className="mb-4">
          <Form.List name="filePatterns">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field, index) => (
                  <Form.Item required={false} key={field.key}>
                    <Form.Item
                      {...field}
                      validateTrigger={['onChange', 'onBlur']}
                      rules={[
                        {
                          required: true,
                          whitespace: true,
                          message: 'Please input file pattern or delete this field.',
                        },
                      ]}
                      noStyle
                    >
                      <Input
                        placeholder="File pattern (e.g., *.pdf)"
                        style={{ width: '90%' }}
                      />
                    </Form.Item>
                    {fields.length > 1 && (
                      <MinusCircleOutlined
                        className="ml-2"
                        onClick={() => remove(field.name)}
                      />
                    )}
                  </Form.Item>
                ))}
                <Form.Item>
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    icon={<PlusOutlined />}
                    className="w-full"
                  >
                    Add File Pattern
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </Card>

        {/* Options */}
        <Card title="Processing Options" size="small" className="mb-4">
          <Form.Item
            name={['options', 'deleteAfterProcessing']}
            valuePropName="checked"
          >
            <Switch checkedChildren="Delete after processing" unCheckedChildren="Keep files" />
          </Form.Item>

          <Form.Item
            name={['options', 'createArchive']}
            valuePropName="checked"
          >
            <Switch checkedChildren="Create archive" unCheckedChildren="No archive" />
          </Form.Item>

          <Form.Item
            name={['options', 'validateContent']}
            valuePropName="checked"
          >
            <Switch checkedChildren="Validate content" unCheckedChildren="Skip validation" />
          </Form.Item>

          <Form.Item
            name={['options', 'retryCount']}
            label="Retry Count"
            rules={[{ required: true }]}
          >
            <Select>
              {[0, 1, 2, 3, 4, 5].map(num => (
                <Option key={num} value={num}>{num}</Option>
              ))}
            </Select>
          </Form.Item>
        </Card>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            icon={<SaveOutlined />}
            loading={loading}
            className="w-full"
          >
            Save Configuration
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default JobConfigEditor; 