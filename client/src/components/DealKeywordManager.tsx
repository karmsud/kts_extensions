import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Select, Modal, Form, message, Tag, Space, Upload } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, SearchOutlined, UploadOutlined } from '@ant-design/icons';
import { Deal } from '../types/deal';

const { Search } = Input;
const { Option } = Select;

interface ServicerOption {
  id: number;
  name: string;
}

const DealKeywordManager: React.FC = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [servicers, setServicers] = useState<ServicerOption[]>([]);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchDeals();
    fetchServicers();
  }, []);

  const fetchDeals = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/deals');
      const data = await response.json();
      setDeals(data);
    } catch (error) {
      message.error('Failed to fetch deals');
    }
    setLoading(false);
  };

  const fetchServicers = async () => {
    try {
      const response = await fetch('/api/v1/servicers');
      const data = await response.json();
      setServicers(data);
    } catch (error) {
      message.error('Failed to fetch servicers');
    }
  };

  const handleSave = async (values: any) => {
    try {
      const url = editingDeal 
        ? `/api/v1/deals/${editingDeal.id}` 
        : '/api/v1/deals';
      
      const response = await fetch(url, {
        method: editingDeal ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        message.success(`Deal ${editingDeal ? 'updated' : 'created'} successfully`);
        setIsModalVisible(false);
        fetchDeals();
        form.resetFields();
      } else {
        message.error('Operation failed');
      }
    } catch (error) {
      message.error('Operation failed');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/v1/deals/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        message.success('Deal deleted successfully');
        fetchDeals();
      } else {
        message.error('Failed to delete deal');
      }
    } catch (error) {
      message.error('Failed to delete deal');
    }
  };

  const handleBulkImport = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('csvFile', file);

      const response = await fetch('/api/v1/deals/import-csv', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        message.success(`Successfully imported ${result.imported} deals`);
        fetchDeals();
      } else {
        message.error('Failed to import deals');
      }
    } catch (error) {
      message.error('Failed to import deals');
    }
  };

  const columns = [
    {
      title: 'Deal Name',
      dataIndex: 'deal_name',
      key: 'deal_name',
      sorter: (a: Deal, b: Deal) => a.deal_name.localeCompare(b.deal_name),
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value: boolean | React.Key, record: Deal) =>
        record.deal_name.toLowerCase().includes(String(value).toLowerCase()),
    },
    {
      title: 'Keywords',
      dataIndex: 'keyword',
      key: 'keyword',
      render: (keywords: string) => (
        <Space size={[0, 8]} wrap>
          {keywords.split(',').map((keyword) => (
            <Tag key={keyword} color="blue">
              {keyword.trim()}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'Servicer',
      dataIndex: 'servicer_id',
      key: 'servicer_id',
      render: (servicerId: number) => {
        const servicer = servicers.find(s => s.id === servicerId);
        return servicer ? servicer.name : servicerId;
      },
      filters: servicers.map(servicer => ({
        text: servicer.name,
        value: servicer.id,
      })),
      onFilter: (value: boolean | React.Key, record: Deal) => record.servicer_id === Number(value),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Deal) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingDeal(record);
              form.setFieldsValue(record);
              setIsModalVisible(true);
            }}
          />
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between mb-4">
        <Search
          placeholder="Search deals..."
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
        />
        <Space>
          <Upload
            accept=".csv"
            showUploadList={false}
            beforeUpload={(file) => {
              handleBulkImport(file);
              return false;
            }}
          >
            <Button icon={<UploadOutlined />}>Import CSV</Button>
          </Upload>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingDeal(null);
              form.resetFields();
              setIsModalVisible(true);
            }}
          >
            Add Deal
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={deals}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingDeal ? 'Edit Deal' : 'Add Deal'}
        open={isModalVisible}
        onOk={form.submit}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          <Form.Item
            name="deal_name"
            label="Deal Name"
            rules={[{ required: true, message: 'Please enter deal name' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="keyword"
            label="Keywords"
            rules={[{ required: true, message: 'Please enter keywords' }]}
            extra="Separate multiple keywords with commas"
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="servicer_id"
            label="Servicer"
            rules={[{ required: true, message: 'Please select servicer' }]}
          >
            <Select>
              {servicers.map(servicer => (
                <Option key={servicer.id} value={servicer.id}>
                  {servicer.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DealKeywordManager; 