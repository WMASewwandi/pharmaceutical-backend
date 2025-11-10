import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import {
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  // --- REMOVED ---
  // TablePagination,
  Chip,
  Box,
  IconButton,
  Tooltip,
  Typography,
  // --- ADDED ---
  Pagination,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import Link from "next/link";
import styles from "@/styles/PageTitle.module.css";
import DeleteIcon from "@mui/icons-material/Delete";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useRouter } from "next/router";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import EditContactCRM from "./edit";
import usePaginatedFetch from "@/components/hooks/usePaginatedFetch";
import useApi from "@/components/utils/useApi";
import BASE_URL from "Base/api";

const ContactCRM = () => {
  const cId = sessionStorage.getItem("category");
  const { navigate, create, update, remove } = IsPermissionEnabled(cId);
  const router = useRouter();

  const [tagMap, setTagMap] = useState({});
  const [lifeCycleMap, setLifeCycleMap] = useState({});

  const { data: enumsData, loading: enumsLoading } = useApi("/Enums/crm");

  useEffect(() => {
    if (enumsData) {
      if (enumsData.leadTags) {
        setTagMap(enumsData.leadTags);
      }
      if (enumsData.lifeCycleStages) {
        setLifeCycleMap(enumsData.lifeCycleStages);
      }
    }
  }, [enumsData]);

  const {
    data: contacts,
    totalCount,
    page,
    pageSize,
    search,
    setPage,
    setPageSize,
    setSearch,
    fetchData: fetchContacts,
    loading: contactsLoading,
  } = usePaginatedFetch("ContactCRM/GetAllContactCRMs");

  // Fetch data on component mount
  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const navigateToCreate = () => router.push("/crm/contact/create-contact");

  const handleDelete = async (id) => {
    try {
      const response = await fetch(
        `${BASE_URL}/ContactCRM/DeleteContactCRM?id=${id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const result = await response.json();

      if (response.ok) {
        toast.success(result.message || "Contact deleted successfully!");
        fetchContacts();
      } else {
        toast.error(result.message || "Failed to delete contact.");
      }
    } catch (err) {
      toast.error("An error occurred while connecting to the server.");
    }
  };

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    fetchContacts(1, event.target.value, pageSize);
    setPage(1);
  };

  // --- CHANGED: Handler for Pagination component ---
  const handlePageChange = (event, value) => {
    setPage(value);
    fetchContacts(value, search, pageSize);
  };

  // --- CHANGED: Handler for PageSize Select component ---
  const handlePageSizeChange = (event) => {
    const size = event.target.value;
    setPageSize(size);
    setPage(1);
    fetchContacts(1, search, size);
  };

  const getLifeCycleChipColor = (stageId) => {
    const stageName = lifeCycleMap[stageId] || "";
    switch (stageName.toLowerCase()) {
      case "customer":
        return "success";
      case "sql":
        return "warning";
      case "mql":
        return "secondary";
      case "lead":
        return "primary";
      case "subscriber":
        return "default";
      default:
        return "default";
    }
  };

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Contact</h1>
        <ul>
          <li>
            <Link href="/crm/contact">Contact</Link>
          </li>
        </ul>
      </div>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Search className="search-form">
            <StyledInputBase
              placeholder="Search..."
              value={search}
              onChange={handleSearchChange}
            />
          </Search>
        </Grid>
        <Grid item xs={12} md={8} display="flex" justifyContent="end" gap={1}>
          {create && (
            <Button variant="outlined" size="small" onClick={navigateToCreate}>
              + New Contact
            </Button>
          )}
        </Grid>
        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Lifecycle Stage</TableCell>
                  <TableCell>Tag</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {contactsLoading || enumsLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography>Loading...</Typography>
                    </TableCell>
                  </TableRow>
                ) : contacts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography color="error">
                        No Contacts Available
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  contacts.map((item) => {
                    let tagIds = [];
                    try {
                      if (typeof item.tags === "string") {
                        tagIds = JSON.parse(item.tags); 
                      } else if (Array.isArray(item.tags)) {
                        tagIds = item.tags;
                      }
                    } catch (e) {
                      console.error("Failed to parse tags:", item.tags, e);
                    }

                    const tagNames = Array.isArray(tagIds)
                      ? tagIds
                          .map((tagId) => tagMap[tagId]) 
                          .filter(Boolean)
                      : [];

                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          {item.firstname} {item.lastname}
                        </TableCell>
                        <TableCell>{item.email}</TableCell>
                        <TableCell>{item.phone}</TableCell>
                        <TableCell>{item.title || "--"}</TableCell>
                        <TableCell>
                          <Chip
                            label={
                              lifeCycleMap[item.lifeCycleStage] || "Unknown"
                            }
                            color={getLifeCycleChipColor(item.lifeCycleStage)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: 0.5,
                            }}
                          >
                            {tagNames.length > 0 ? (
                              tagNames.map((name, index) => (
                                <Chip
                                  key={index}
                                  label={name}
                                  size="small"
                                  variant="outlined"
                                />
                              ))
                            ) : (
                              "--"
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Box
                            sx={{ display: "flex", justifyContent: "flex-end" }}
                          >
                            {update && (
                              <EditContactCRM
                                item={item}
                                fetchItems={fetchContacts}
                              />
                            )}
                            {remove && (
                              <Tooltip title="Delete Contact">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleDelete(item.id)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            <Grid container justifyContent="space-between" mt={2} mb={2}>
              <Pagination
                count={Math.ceil(totalCount / pageSize)}
                page={page}
                onChange={handlePageChange}
                color="primary"
                shape="rounded"
              />
              <FormControl size="small" sx={{ mr: 2, width: "100px" }}>
                <InputLabel>Page Size</InputLabel>
                <Select
                  value={pageSize}
                  label="Page Size"
                  onChange={handlePageSizeChange}
                >
                  <MenuItem value={5}>5</MenuItem>
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={25}>25</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </TableContainer>
        </Grid>
      </Grid>
    </>
  );
};

export default ContactCRM;